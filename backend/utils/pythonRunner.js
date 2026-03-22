const { spawn } = require('child_process');
const path = require('path');

/**
 * Execute Python script and return results
 * @param {Object} inputData - Data to send to Python script
 * @returns {Promise} - Resolves with Python script output
 */
const runPythonScript = (inputData) => {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    const scriptPath = path.resolve(__dirname, process.env.PYTHON_SCRIPT_PATH || '../../python-ai/predict_sales.py');
    
    console.log(`🐍 Running Python script: ${scriptPath}`);
    console.log(`📊 Input data:`, inputData);

    const python = spawn(pythonPath, [scriptPath]);
    
    let dataString = '';
    let errorString = '';

    // Send input data to Python script
    python.stdin.write(JSON.stringify(inputData));
    python.stdin.end();

    // Collect data from Python script
    python.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    // Collect errors
    python.stderr.on('data', (data) => {
      errorString += data.toString();
      console.error(`Python stderr: ${data}`);
    });

    // Handle script completion
    python.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Python script exited with code ${code}`);
        console.error(`Error output: ${errorString}`);
        reject(new Error(`Python script failed: ${errorString || 'Unknown error'}`));
        return;
      }

      try {
        // Parse JSON output from Python
        const result = JSON.parse(dataString);
        console.log(`✅ Python script completed successfully`);
        resolve(result);
      } catch (error) {
        console.error(`❌ Failed to parse Python output: ${dataString}`);
        reject(new Error(`Failed to parse Python output: ${error.message}`));
      }
    });

    // Handle errors
    python.on('error', (error) => {
      console.error(`❌ Failed to start Python script: ${error.message}`);
      reject(new Error(`Failed to start Python script: ${error.message}`));
    });
  });
};

module.exports = {
  runPythonScript
};
