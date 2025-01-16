import sys

def process_message(message):
    # A simple example: reverse the received message
    return message[::-1]

if __name__ == "__main__":
    # Get the message from command-line arguments
    input_message = sys.argv[1]
    
    # Process the message
    result = process_message(input_message)
    
    # Output the result
    print(result)
