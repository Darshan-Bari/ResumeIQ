# ResumeIQ Backend

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask server:
```bash
python -m app.main
```

Server will start on http://localhost:5000

## Testing

Run the test script:
```bash
python test_api.py
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # Flask application and routes
│   ├── resume_parser.py  # Resume PDF parsing logic
│   ├── matching_engine.py # TF-IDF and matching logic
│   └── utils/
├── uploads/              # Uploaded resume PDFs
├── sample_data/          # Sample data for testing
├── requirements.txt
├── test_api.py          # API testing script
└── README.md
```
