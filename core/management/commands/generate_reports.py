from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum, Q
from core.models import Invoice
import json
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Generate automated reports for revenue and arrears'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            choices=['revenue', 'arrears', 'both'],
            default='both',
            help='Type of report to generate (default: both)',
        )
        parser.add_argument(
            '--period',
            type=str,
            help='Period for reports in YYYY-MM format (default: current month)',
        )
        parser.add_argument(
            '--output',
            choices=['console', 'json'],
            default='console',
            help='Output format (default: console)',
        )
        parser.add_argument(
            '--file',
            type=str,
            help='Output file path for JSON format',
        )

    def handle(self, *args, **options):
        report_type = options['type']
        output_format = options['output']
        output_file = options['file']
        
        # Default to current month if no period specified
        if options['period']:
            try:
                datetime.strptime(options['period'], '%Y-%m')
                period = options['period']
            except ValueError:
                self.stdout.write(
                    self.style.ERROR('Invalid period format. Use YYYY-MM')
                )
                return
        else:
            now = timezone.now()
            period = now.strftime('%Y-%m')

        results = {}

        if report_type in ['revenue', 'both']:
            results['revenue'] = self.generate_revenue_report(period)

        if report_type in ['arrears', 'both']:
            results['arrears'] = self.generate_arrears_report(period)

        # Output results
        if output_format == 'json':
            json_output = json.dumps(results, indent=2, default=str)
            if output_file:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(json_output)
                self.stdout.write(
                    self.style.SUCCESS(f'Report saved to {output_file}')
                )
            else:
                self.stdout.write(json_output)
        else:
            self.display_console_output(results, period)

    def generate_revenue_report(self, period):
        """Generate revenue report for the specified period"""
        paid_invoices = Invoice.objects.filter(
            status=Invoice.PAID,
            period=period
        )
        
        total_revenue = paid_invoices.aggregate(
            total=Sum('total')
        )['total'] or 0
        
        return {
            'period': period,
            'total_revenue': float(total_revenue),
            'paid_invoices_count': paid_invoices.count(),
            'generated_at': timezone.now().isoformat()
        }

    def generate_arrears_report(self, period):
        """Generate arrears report for the specified period"""
        unpaid_invoices = Invoice.objects.filter(
            Q(status=Invoice.UNPAID) | Q(status=Invoice.OVERDUE),
            period=period
        ).select_related(
            'contract', 'contract__room', 'contract__tenant', 'contract__tenant__user'
        )
        
        total_unpaid = unpaid_invoices.aggregate(
            total=Sum('total')
        )['total'] or 0
        
        overdue_invoices = unpaid_invoices.filter(status=Invoice.OVERDUE)
        total_overdue = overdue_invoices.aggregate(
            total=Sum('total')
        )['total'] or 0
        
        # Get details
        invoice_details = []
        today = timezone.now().date()
        
        for invoice in unpaid_invoices:
            days_overdue = 0
            if invoice.due_date < today:
                days_overdue = (today - invoice.due_date).days
            
            invoice_details.append({
                'invoice_id': invoice.id,
                'room_name': invoice.contract.room.name,
                'tenant_name': invoice.contract.tenant.user.full_name,
                'tenant_email': invoice.contract.tenant.user.email,
                'total': float(invoice.total),
                'status': invoice.status,
                'due_date': invoice.due_date,
                'days_overdue': days_overdue
            })
        
        return {
            'period': period,
            'total_unpaid_amount': float(total_unpaid),
            'total_overdue_amount': float(total_overdue),
            'unpaid_count': unpaid_invoices.count(),
            'overdue_count': overdue_invoices.count(),
            'unpaid_invoices': invoice_details,
            'generated_at': timezone.now().isoformat()
        }

    def display_console_output(self, results, period):
        """Display results in formatted console output"""
        self.stdout.write(f"\n{self.style.SUCCESS('=== RENTAL MANAGEMENT REPORTS ===')} ")
        self.stdout.write(f"Period: {period}")
        self.stdout.write(f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

        if 'revenue' in results:
            revenue = results['revenue']
            self.stdout.write(f"{self.style.SUCCESS('REVENUE REPORT')}")
            self.stdout.write("-" * 30)
            self.stdout.write(f"Total Revenue: {revenue['total_revenue']:,.0f} VND")
            self.stdout.write(f"Paid Invoices: {revenue['paid_invoices_count']}")
            self.stdout.write("")

        if 'arrears' in results:
            arrears = results['arrears']
            self.stdout.write(f"{self.style.WARNING('ARREARS REPORT')}")
            self.stdout.write("-" * 30)
            self.stdout.write(f"Total Unpaid: {arrears['total_unpaid_amount']:,.0f} VND")
            self.stdout.write(f"Total Overdue: {arrears['total_overdue_amount']:,.0f} VND")
            self.stdout.write(f"Unpaid Count: {arrears['unpaid_count']}")
            self.stdout.write(f"Overdue Count: {arrears['overdue_count']}")
            
            if arrears['unpaid_invoices']:
                self.stdout.write(f"\n{self.style.WARNING('UNPAID INVOICES:')}")
                for invoice in arrears['unpaid_invoices']:
                    status_style = self.style.ERROR if invoice['status'] == 'OVERDUE' else self.style.WARNING
                    self.stdout.write(
                        f"  • {invoice['room_name']} - {invoice['tenant_name']} "
                        f"({status_style(invoice['status'])}) - "
                        f"{invoice['total']:,.0f} VND"
                    )
                    if invoice['days_overdue'] > 0:
                        overdue_msg = f"OVERDUE: {invoice['days_overdue']} days"
                        self.stdout.write(f"    {self.style.ERROR(overdue_msg)}")

        self.stdout.write(f"\n{self.style.SUCCESS('Report generation completed!')}")
