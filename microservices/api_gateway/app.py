from src import create_app
from src.config import Config


app = create_app()


if __name__ == "__main__":
    config = Config()
    app.run(host="0.0.0.0", port=config.gateway_port, debug=config.debug)
