from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Invoice


class Command(BaseCommand):
    help = 'Mark invoices as overdue if they are past their due date'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            dest='dry_run',
            help='Show what would be marked as overdue without actually updating',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        today = timezone.now().date()
        
        # Find unpaid invoices past their due date
        overdue_invoices = Invoice.objects.filter(
            status=Invoice.UNPAID,
            due_date__lt=today
        )
        
        count = overdue_invoices.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would mark {count} invoices as overdue')
            )
            for invoice in overdue_invoices:
                self.stdout.write(f'  - Invoice {invoice.id} (Contract: {invoice.contract}, Due: {invoice.due_date})')
        else:
            if count > 0:
                overdue_invoices.update(status=Invoice.OVERDUE)
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully marked {count} invoices as overdue')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS('No invoices to mark as overdue')
                )
