import os
import json
from flask import Flask, request
from imdb import Cinemagoer

server = Flask(__name__)
ia = Cinemagoer()

@server.route('/movie', methods=['GET'])
def movie_api():
    movie_name = request.args.get('name')
    if not movie_name:
        return json.dumps({"status": "error", "message": "name parameter missing"}), 400
    
    try:
        # মুভি সার্চ করা
        search = ia.search_movie(movie_name)
        if not search:
            return json.dumps({"status": "error", "message": "not found"}), 404
        
        # প্রথম রেজাল্টটি নেওয়া এবং বিস্তারিত তথ্য বের করা
        movie_id = search[0].movieID
        movie = ia.get_movie(movie_id)

        response = {
            "status": "success",
            "title": movie.get('title'),
            "year": movie.get('year'),
            "rating": movie.get('rating', 'N/A'),
            "description": movie.get('plot outline', movie.get('plot', ['No plot available'])[0]),
            "genre": movie.get('genres', []),
            "poster": movie.get('full-size cover url'),
            "actors": [person['name'] for person in movie.get('cast', [])[:5]]
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
        
