# This file contains the WSGI configuration required to serve up your
# web application at http://<your-username>.pythonanywhere.com/
# It works by setting the variable 'application' to a WSGI handler of some description.

import sys
import os

# 1. Expand the python path with our project directory.
# UPDATE 'your_username' below to your actual pythonanywhere username!
project_home = '/home/your_username/4DPlasticsPVTltd'
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

# 2. Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(project_home, '.env'))

# 3. Import the flask app but name it "application" for WSGI to work
from app import app as application
