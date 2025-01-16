using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace BluetoothWebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BluetoothController : ControllerBase
    {
        [HttpPost("send")]
        public ActionResult<string> SendMessage([FromBody] string message)
        {
            // Call the Python script and return the result
            string result = CallPythonScript(message);
            return Ok(result);
        }

        private string CallPythonScript(string inputMessage)
        {
            string pythonScriptPath = "process_message.py";
            string pythonInterpreter = "python";

            ProcessStartInfo processStartInfo = new ProcessStartInfo
            {
                FileName = pythonInterpreter,
                Arguments = $"{pythonScriptPath} \"{inputMessage}\"",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            Process process = Process.Start(processStartInfo);
            string output = process.StandardOutput.ReadToEnd();
            process.WaitForExit();
            return output.Trim();
        }
    }
}
