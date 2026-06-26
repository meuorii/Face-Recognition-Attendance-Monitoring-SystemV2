from flask import Blueprint


instructor_bp = Blueprint("instructor", __name__)


from . import overview_routes
from . import instructor_routes