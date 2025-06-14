# Python examples for authorising the user with Shapes API using shapesinc.py

> Note: This example uses [shapesinc.py](https://github.com/Rishiraj0100/shapesinc-py) to interact with API.

## Prerequisites

- Python 3.8+
- pip
- virtualenv

## Setup

```bash
./setup.sh
```

This will create a virtual environment and install the required dependencies.

## Usage

Copy the `.env.example` file to `.env` and add your API keys.

```bash
source venv/bin/activate
python main.py --user-id <user-id> [message]
```

### Command Line Arguments

- `user-id`: The ID of the user.
- `message`: The message to send to the shape. If not provided, a default greeting will be used.

### Examples

```bash
# Basic usage with a message
python main.py Hello, how are you today?
```

