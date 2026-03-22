import os
import json
from flask import Flask, request
from PyMovieDb import IMDB

server = Flask(__name__)
imdb = IMDB()

@server.route('/movie', methods=['GET'])
def movie_api():
    movie_name = request.args.get('name')
    if not movie_name:
        return json.dumps({"status": "error", "message": "name parameter missing"}), 400
    
    try:
        # IMDb থেকে র ডাটা নেওয়া
        res = imdb.get_by_name(movie_name)
        data = json.loads(res)

        # ডাটা চেক করা
        if not data or "name" not in data:
             return json.dumps({"status": "error", "message": "not found"}), 404
             
        response = {
            "status": "success",
            "title": data.get("name"),
            "year": data.get("datePublished"),
            "rating": data.get("aggregateRating", {}).get("ratingValue") if data.get("aggregateRating") else "N/A",
            "description": data.get("description"),
            "genre": data.get("genre"),
            "poster": data.get("image"),
            "actors": [a.get("name") for a in data.get("actor", [])] if data.get("actor") else []
        }
        return json.dumps(response), 200

    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)}), 500

@server.route("/")
def index():
    return "API Server is Active", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    server.run(host="0.0.0.0", port=port)
        
