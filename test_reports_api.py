"""
Test script for Reports API functionality
"""

import requests
import json
from datetime import datetime


class ReportsAPITester:
    def __init__(self, base_url="http://localhost:8000", token=None):
        self.base_url = base_url
        self.headers = {
            "Content-Type": "application/json"
        }
        if token:
            self.headers["Authorization"] = f"Bearer {token}"

    def test_revenue_report(self, from_period="2025-01", to_period="2025-08"):
        """Test revenue report endpoint"""
        url = f"{self.base_url}/api/reports/revenue/"
        params = {
            "from": from_period,
            "to": to_period
        }
        
        try:
            response = requests.get(url, params=params, headers=self.headers)
            print(f"\n=== REVENUE REPORT TEST ===")
            print(f"URL: {url}")
            print(f"Params: {params}")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ SUCCESS")
                print(f"Total Revenue: {data['total_revenue']:,.0f} VND")
                print(f"Period: {data['period_from']} to {data['period_to']}")
                print(f"Monthly Breakdown:")
                for month in data['monthly_breakdown']:
                    print(f"  {month['period']}: {month['revenue']:,.0f} VND ({month['paid_invoices_count']} invoices)")
            else:
                print(f"❌ ERROR: {response.text}")
                
        except Exception as e:
            print(f"❌ EXCEPTION: {str(e)}")

    def test_arrears_report(self, period=None):
        """Test arrears report endpoint"""
        url = f"{self.base_url}/api/reports/arrears/"
        params = {}
        if period:
            params["period"] = period
        
        try:
            response = requests.get(url, params=params, headers=self.headers)
            print(f"\n=== ARREARS REPORT TEST ===")
            print(f"URL: {url}")
            print(f"Params: {params}")
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                summary = data['summary']
                print(f"✅ SUCCESS")
                print(f"Total Unpaid: {summary['total_unpaid_amount']:,.0f} VND")
                print(f"Total Overdue: {summary['total_overdue_amount']:,.0f} VND")
                print(f"Unpaid Count: {summary['unpaid_count']}")
                print(f"Overdue Count: {summary['overdue_count']}")
                print(f"Period Filter: {summary['period_filter']}")
                
                if data['unpaid_invoices']:
                    print(f"\nUnpaid Invoices:")
                    for invoice in data['unpaid_invoices']:
                        status_indicator = "🔴" if invoice['status'] == 'OVERDUE' else "🟡"
                        print(f"  {status_indicator} Invoice #{invoice['invoice_id']}: {invoice['room_name']} - {invoice['tenant_name']}")
                        print(f"     Amount: {invoice['total']:,.0f} VND | Status: {invoice['status']} | Due: {invoice['due_date']}")
                        if invoice['days_overdue'] > 0:
                            print(f"     ⚠️  OVERDUE: {invoice['days_overdue']} days")
            else:
                print(f"❌ ERROR: {response.text}")
                
        except Exception as e:
            print(f"❌ EXCEPTION: {str(e)}")

    def test_error_cases(self):
        """Test various error scenarios"""
        print(f"\n=== ERROR CASES TEST ===")
        
        # Test missing parameters
        response = requests.get(f"{self.base_url}/api/reports/revenue/", headers=self.headers)
        print(f"Missing params - Status: {response.status_code}")
        
        # Test invalid date format
        params = {"from": "2025-13", "to": "2025-14"}
        response = requests.get(f"{self.base_url}/api/reports/revenue/", params=params, headers=self.headers)
        print(f"Invalid format - Status: {response.status_code}")
        
        # Test invalid date range
        params = {"from": "2025-08", "to": "2025-01"}
        response = requests.get(f"{self.base_url}/api/reports/revenue/", params=params, headers=self.headers)
        print(f"Invalid range - Status: {response.status_code}")

    def run_all_tests(self):
        """Run all report tests"""
        print("🚀 Starting Reports API Tests...")
        
        # Test revenue report
        self.test_revenue_report()
        
        # Test arrears report (all periods)
        self.test_arrears_report()
        
        # Test arrears report (specific period)
        current_month = datetime.now().strftime("%Y-%m")
        self.test_arrears_report(period=current_month)
        
        # Test error cases
        self.test_error_cases()
        
        print(f"\n✅ All tests completed!")


if __name__ == "__main__":
    # Example usage
    print("Reports API Test Script")
    print("======================")
    print("Make sure your Django server is running on localhost:8000")
    print("You need to provide a valid OWNER token for authentication")
    
    # Replace with actual token from your authentication
    token = input("\nEnter your Bearer token (or press Enter to test without auth): ").strip()
    
    tester = ReportsAPITester(token=token if token else None)
    tester.run_all_tests()
