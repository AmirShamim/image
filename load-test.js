/**
 * Simple Load Testing Script for ImageStudio
 *
 * Usage:
 *   node load-test.js [BASE_URL] [CONCURRENT_USERS] [TEST_IMAGE_PATH]
 *
 * Examples:
 *   node load-test.js http://localhost:5000 5 ./test-image.jpg
 *   node load-test.js https://your-app.onrender.com 3
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuration
const BASE_URL = process.argv[2] || 'http://localhost:5000';
const CONCURRENT_USERS = parseInt(process.argv[3]) || 3;
const TEST_IMAGE_PATH = process.argv[4] || null;

// Create a simple test image if none provided
const createTestImage = () => {
  // Create a simple 100x100 test image using Node's buffer
  // This is a minimal valid JPEG
  const testImagePath = './test-load-image.jpg';

  if (fs.existsSync(testImagePath)) {
    return testImagePath;
  }

  console.log('Note: No test image provided. Use: node load-test.js [URL] [USERS] [IMAGE_PATH]');
  console.log('For accurate testing, please provide a real image file.\n');
  return null;
};

// Test the health endpoint
async function testHealth() {
  console.log('\n📊 Testing Health Endpoint...');
  try {
    const start = Date.now();
    const response = await axios.get(`${BASE_URL}/api/health`);
    const time = Date.now() - start;

    console.log(`   ✅ Health check passed (${time}ms)`);
    console.log(`   Memory: ${response.data.memory?.heapUsed || 'N/A'}`);
    console.log(`   Active processes: ${response.data.processing?.activeJobs || 0}/${response.data.processing?.maxConcurrent || 'N/A'}`);
    console.log(`   Uptime: ${response.data.uptime?.formatted || 'N/A'}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Health check failed: ${error.message}`);
    return false;
  }
}

// Test rate limiting
async function testRateLimiting() {
  console.log('\n🚦 Testing Rate Limiting...');
  const requests = [];
  const startTime = Date.now();

  // Make 15 rapid requests to trigger rate limit
  for (let i = 0; i < 15; i++) {
    requests.push(
      axios.get(`${BASE_URL}/api/health`)
        .then(() => ({ success: true }))
        .catch(err => ({
          success: false,
          status: err.response?.status,
          limited: err.response?.status === 429
        }))
    );
  }

  const results = await Promise.all(requests);
  const successful = results.filter(r => r.success).length;
  const rateLimited = results.filter(r => r.limited).length;

  console.log(`   Total requests: 15`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Rate limited (429): ${rateLimited}`);
  console.log(`   Time: ${Date.now() - startTime}ms`);

  if (rateLimited > 0) {
    console.log('   ✅ Rate limiting is working!');
  } else {
    console.log('   ⚠️ Rate limiting may not be configured or limit not reached');
  }
}

// Test concurrent API calls
async function testConcurrentLoad() {
  console.log(`\n👥 Testing Concurrent Load (${CONCURRENT_USERS} users)...`);

  const results = [];
  const startTime = Date.now();

  const promises = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    promises.push(
      (async () => {
        const userStart = Date.now();
        try {
          // Simulate user session - multiple API calls
          await axios.get(`${BASE_URL}/api/health`);
          const responseTime = Date.now() - userStart;
          return { user: i, success: true, time: responseTime };
        } catch (error) {
          return {
            user: i,
            success: false,
            error: error.message,
            status: error.response?.status
          };
        }
      })()
    );
  }

  const loadResults = await Promise.all(promises);
  const totalTime = Date.now() - startTime;

  const successful = loadResults.filter(r => r.success);
  const failed = loadResults.filter(r => !r.success);

  console.log(`   Total time: ${totalTime}ms`);
  console.log(`   Successful: ${successful.length}/${CONCURRENT_USERS}`);
  if (successful.length > 0) {
    const avgTime = successful.reduce((a, b) => a + b.time, 0) / successful.length;
    console.log(`   Avg response time: ${avgTime.toFixed(0)}ms`);
  }
  if (failed.length > 0) {
    console.log(`   Failed requests:`);
    failed.forEach(f => console.log(`     - User ${f.user}: ${f.error} (${f.status || 'no status'})`));
  }
}

// Test image resize endpoint (if image provided)
async function testImageResize(imagePath) {
  if (!imagePath || !fs.existsSync(imagePath)) {
    console.log('\n🖼️ Skipping Image Resize Test (no valid image path provided)');
    return;
  }

  console.log(`\n🖼️ Testing Image Resize Endpoint...`);

  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));
  form.append('resizeType', 'percentage');
  form.append('percentage', '50');
  form.append('quality', '85');
  form.append('format', 'jpg');

  const start = Date.now();

  try {
    const response = await axios.post(`${BASE_URL}/resize`, form, {
      headers: form.getHeaders(),
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const time = Date.now() - start;
    const outputSize = response.data.length;

    console.log(`   ✅ Resize successful (${time}ms)`);
    console.log(`   Output size: ${(outputSize / 1024).toFixed(1)}KB`);
  } catch (error) {
    console.log(`   ❌ Resize failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${error.response.data?.toString()?.slice(0, 200) || 'N/A'}`);
    }
  }
}

// Test concurrent image processing
async function testConcurrentImageProcessing(imagePath) {
  if (!imagePath || !fs.existsSync(imagePath)) {
    console.log('\n⚡ Skipping Concurrent Image Processing Test (no valid image path)');
    return;
  }

  console.log(`\n⚡ Testing Concurrent Image Processing (${CONCURRENT_USERS} users)...`);

  const promises = [];

  for (let i = 0; i < CONCURRENT_USERS; i++) {
    promises.push(
      (async () => {
        const form = new FormData();
        form.append('image', fs.createReadStream(imagePath));
        form.append('resizeType', 'percentage');
        form.append('percentage', '50');
        form.append('quality', '80');
        form.append('format', 'jpg');

        const start = Date.now();

        try {
          await axios.post(`${BASE_URL}/resize`, form, {
            headers: form.getHeaders(),
            responseType: 'arraybuffer',
            timeout: 60000
          });

          return { user: i, success: true, time: Date.now() - start };
        } catch (error) {
          return {
            user: i,
            success: false,
            time: Date.now() - start,
            error: error.message,
            status: error.response?.status
          };
        }
      })()
    );
  }

  const results = await Promise.all(promises);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const serverBusy = results.filter(r => r.status === 503);
  const rateLimited = results.filter(r => r.status === 429);

  console.log(`   Results:`);
  console.log(`   ├─ Successful: ${successful.length}`);
  console.log(`   ├─ Server Busy (503): ${serverBusy.length}`);
  console.log(`   ├─ Rate Limited (429): ${rateLimited.length}`);
  console.log(`   └─ Other Failures: ${failed.length - serverBusy.length - rateLimited.length}`);

  if (successful.length > 0) {
    const avgTime = successful.reduce((a, b) => a + b.time, 0) / successful.length;
    const maxTime = Math.max(...successful.map(r => r.time));
    const minTime = Math.min(...successful.map(r => r.time));

    console.log(`\n   Timing:`);
    console.log(`   ├─ Average: ${avgTime.toFixed(0)}ms`);
    console.log(`   ├─ Min: ${minTime}ms`);
    console.log(`   └─ Max: ${maxTime}ms`);
  }

  // Recommendations
  console.log('\n   📋 Analysis:');
  if (serverBusy.length > 0) {
    console.log('   ✅ Queue system is working - blocking excess requests');
  }
  if (rateLimited.length > 0) {
    console.log('   ✅ Rate limiting is working');
  }
  if (successful.length === CONCURRENT_USERS) {
    console.log('   ✅ Server handled all requests successfully');
  }
  if (failed.length > successful.length) {
    console.log('   ⚠️ More failures than successes - server may be overloaded');
  }
}

// Main test runner
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        ImageStudio Load Testing Tool');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`Test Image: ${TEST_IMAGE_PATH || 'Not provided'}`);
  console.log('═══════════════════════════════════════════════════════════');

  // Run tests
  const healthOk = await testHealth();

  if (!healthOk) {
    console.log('\n❌ Server not responding. Please check if it\'s running.');
    console.log('   If testing Render.com, the server might be sleeping (free tier).');
    console.log('   Try accessing the URL in a browser first to wake it up.');
    return;
  }

  await testRateLimiting();
  await testConcurrentLoad();
  await testImageResize(TEST_IMAGE_PATH);
  await testConcurrentImageProcessing(TEST_IMAGE_PATH);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('        Test Complete');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n💡 Tips for better testing:');
  console.log('   1. Provide a real test image for accurate processing tests');
  console.log('   2. Monitor Render dashboard during tests for resource usage');
  console.log('   3. Try increasing CONCURRENT_USERS to find your limit');
  console.log('   4. Test during different times of day\n');
}

// Run
runTests().catch(console.error);

