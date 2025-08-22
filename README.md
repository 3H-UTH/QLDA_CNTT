# 3H Rental Management System

A comprehensive rental property management system built with Django REST Framework and vanilla JavaScript.

## Features

- **User Management**: Owner and Tenant roles with JWT authentication
- **Room Management**: CRUD operations for rental properties
- **Contract Management**: Rental agreements and status tracking
- **Meter Reading**: Electricity and water usage tracking
- **Invoice Management**: Automated billing with payment tracking
- **Reports**: Revenue and arrears reporting with charts
- **Tenant Management**: Complete tenant profile management

## Tech Stack

- **Backend**: Django 5.2.5, Django REST Framework
- **Authentication**: JWT (SimpleJWT)
- **Database**: SQLite (default), MySQL/PostgreSQL support
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js for reporting visualizations

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd QLDA_CNTT
```

### 2. Setup Python environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env file with your database settings
# For SQLite (default):
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# For MySQL:
DB_ENGINE=django.db.backends.mysql
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

# For PostgreSQL:
DB_ENGINE=django.db.backends.postgresql
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

### 4. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Test Data (Optional)
```bash
python create_test_data.py
```

This creates:
- Owner user: `owner1` / `password123`
- Sample rooms for testing

### 6. Run Development Server
```bash
python manage.py runserver
```

### 7. Access the Application
- **API Documentation**: http://127.0.0.1:8000/api/schema/swagger-ui/
- **Frontend**: http://127.0.0.1:8000/frontend/
- **Admin Interface**: Login as owner and navigate to admin pages

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Token refresh

### Core Resources
- `GET|POST /api/rooms/` - Room management
- `GET|POST /api/contracts/` - Contract management
- `GET|POST /api/meter-readings/` - Meter readings
- `GET|POST /api/invoices/` - Invoice management
- `GET|POST /api/tenants/` - Tenant management

### Reports
- `GET /api/reports/revenue/` - Revenue reports
- `GET /api/reports/arrears/` - Arrears reports

## Frontend Pages

- **index.html** - Home page with room listings
- **login.html** - User authentication
- **register.html** - User registration
- **dashboard.html** - User dashboard
- **admin.html** - Admin panel for owners
- **room-management.html** - Room CRUD interface
- **invoice-management.html** - Invoice management
- **meter-reading.html** - Meter reading input
- **reports.html** - Financial reports
- **tenant-management.html** - Tenant management

## Development

### File Structure
```
QLDA_CNTT/
├── accounts/          # User authentication app
├── core/             # Main business logic app
├── frontend/         # Frontend files
│   ├── css/          # Stylesheets
│   ├── js/           # JavaScript files
│   └── *.html        # HTML pages
├── rental/           # Django project settings
├── media/            # Uploaded files
├── .env              # Environment variables (not in git)
├── .env.example      # Environment template
├── requirements.txt  # Python dependencies
└── manage.py         # Django management script
```

### Environment Variables

Key environment variables in `.env`:

- `SECRET_KEY` - Django secret key
- `DEBUG` - Debug mode (True/False)
- `DB_ENGINE` - Database engine
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `ALLOWED_HOSTS` - Comma-separated allowed hosts
- `CORS_ALLOWED_ORIGINS` - Comma-separated CORS origins

## Security Notes

- Never commit `.env` file to version control
- Change `SECRET_KEY` in production
- Set `DEBUG=False` in production
- Configure proper `ALLOWED_HOSTS` for production
- Use strong database passwords
- Enable HTTPS in production

## License

This project is for educational purposes.