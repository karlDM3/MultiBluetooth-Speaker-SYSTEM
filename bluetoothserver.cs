using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using InTheHand.Net.Sockets;
using InTheHand.Net.Bluetooth;
using InTheHand.Net.Bluetooth.AttributeIds;

namespace BluetoothServerApp
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Bluetooth Server is starting...");

            // Start the listener thread
            BluetoothListener listener = new BluetoothListener(BluetoothService.SerialPort);
            listener.Start();

            Console.WriteLine("Waiting for a connection...");

            // Wait for a client to connect
            BluetoothClient client = listener.AcceptBluetoothClient();
            Console.WriteLine("Client connected.");

            // Handle client communication in the main thread
            HandleClient(client);
        }

        static void HandleClient(BluetoothClient client)
        {
            NetworkStream stream = client.GetStream();
            byte[] buffer = new byte[1024];
            int bytesRead;

            while ((bytesRead = stream.Read(buffer, 0, buffer.Length)) > 0)
            {
                string receivedMessage = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                Console.WriteLine("Received from client: " + receivedMessage);

                // Call a Python script to process the message
                string result = CallPythonScript(receivedMessage);
                Console.WriteLine("Processed result from Python: " + result);

                // Send the processed result back to the client
                byte[] response = Encoding.UTF8.GetBytes(result);
                stream.Write(response, 0, response.Length);
            }
        }

        static string CallPythonScript(string inputMessage)
        {
            // Start a new process to run the Python script
            string pythonScriptPath = "process_message.py";  // Path to the Python script
            string pythonInterpreter = "python";  // Make sure Python is installed

            // Setup the process to execute the Python script
            ProcessStartInfo processStartInfo = new ProcessStartInfo
            {
                FileName = pythonInterpreter,
                Arguments = $"{pythonScriptPath} \"{inputMessage}\"",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            Process process = Process.Start(processStartInfo);

            // Read the output of the Python script
            string output = process.StandardOutput.ReadToEnd();
            process.WaitForExit();

            return output.Trim();
        }
    }
}

