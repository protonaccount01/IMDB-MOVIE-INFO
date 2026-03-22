import os
import json
import urllib.request
from flask import Flask, request
from PyMovieDb import IMDB

server = Flask(__name__)
imdb = IMDB()

def get_movie_data(name):
    try:
        res = imdb.get_by_name(name)
        return json.loads(res)
    except Exception as e:
        return {"error": str(e)}

@server.route('/movie', methods=['GET'])
def movie_api():
    movie_name = request.args.get('name')
    if not movie_name:
        return json.dumps({"status": "error", "message": "name parameter missing"}), 400
    
    data = get_movie_data(movie_name)
    if "name" not in data:
        return json.dumps({"status": "error", "message": "not found"}), 404
        
    response = {
        "status": "success",
        "title": data.get("name"),
        "year": data.get("datePublished"),
        "rating": data.get("aggregateRating", {}).get("ratingValue"),
        "description": data.get("description"),
        "genre": data.get("genre"),
        "poster": data.get("image"),
        "actors": [a.get("name") for a in data.get("actor", [])]
    }
    return json.dumps(response), 200

@server.route("/")
def index():
    return "API Server is Active", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    server.run(host="0.0.0.0", port=port)
