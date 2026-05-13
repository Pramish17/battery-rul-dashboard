from flask import Flask, jsonify
from flask_cors import CORS
from data_processor import build_api_response

app = Flask(__name__)
CORS(app)

@app.route('/api/battery-data', methods=['GET'])
def battery_data():
    try:
        data = build_api_response()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=5001)