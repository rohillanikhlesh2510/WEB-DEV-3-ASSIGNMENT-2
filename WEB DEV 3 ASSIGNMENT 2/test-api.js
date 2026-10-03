const http = require('http');
const app = require('./app');

async function runTests() {
  const PORT = 3001;
  const server = app.listen(PORT, async () => {
    console.log(`\n--- Running Automated API Verification Suite on port ${PORT} ---\n`);

    const request = (path, method = 'GET', body = null, headers = {}) => {
      return new Promise((resolve, reject) => {
        const reqOptions = {
          hostname: '127.0.0.1',
          port: PORT,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        };

        const req = http.request(reqOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({
                status: res.statusCode,
                body: data ? JSON.parse(data) : {}
              });
            } catch (err) {
              resolve({ status: res.statusCode, body: data });
            }
          });
        });

        req.on('error', reject);
        if (body) {
          req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
      });
    };

    let passed = 0;
    let failed = 0;

    const assert = (condition, title) => {
      if (condition) {
        console.log(` PASS: ${title}`);
        passed++;
      } else {
        console.error(` FAIL: ${title}`);
        failed++;
      }
    };

    try {

      const rootRes = await request('/');
      assert(rootRes.status === 200 && rootRes.body.success === true, 'GET / returns 200 OK and greeting');


      const getRes = await request('/students');
      assert(getRes.status === 200 && Array.isArray(getRes.body.data) && getRes.body.data.length >= 4, 'GET /students returns 200 and list of students');


      const getByIdRes = await request('/students/1');
      assert(getByIdRes.status === 200 && getByIdRes.body.data.id === 1, 'GET /students/1 returns 200 and student details');


      const getNonExistent = await request('/students/999');
      assert(getNonExistent.status === 404 && getNonExistent.body.success === false, 'GET /students/999 returns 404 Not Found');


      const postInvalid = await request('/students', 'POST', {});
      assert(postInvalid.status === 400 && postInvalid.body.success === false, 'POST /students without name/course returns 400 Bad Request');


      const newStudentPayload = { name: 'Lucas Scott', course: 'Cybersecurity', email: 'lucas@example.com' };
      const postRes = await request('/students', 'POST', newStudentPayload);
      assert(postRes.status === 201 && postRes.body.data.name === 'Lucas Scott' && postRes.body.data.id > 4, 'POST /students returns 201 Created and new student with unique ID');


      const putRes = await request(`/students/${postRes.body.data.id}`, 'PUT', { course: 'Network Security' });
      assert(putRes.status === 200 && putRes.body.data.course === 'Network Security', 'PUT /students/:id returns 200 and updated fields');


      const putNonExistent = await request('/students/999', 'PUT', { name: 'Ghost' });
      assert(putNonExistent.status === 404 && putNonExistent.body.success === false, 'PUT /students/999 returns 404 Not Found');


      const deleteRes = await request(`/students/${postRes.body.data.id}`, 'DELETE');
      assert(deleteRes.status === 200 && deleteRes.body.data.name === 'Lucas Scott', 'DELETE /students/:id returns 200 and deleted student');


      const deleteNonExistent = await request('/students/999', 'DELETE');
      assert(deleteNonExistent.status === 404 && deleteNonExistent.body.success === false, 'DELETE /students/999 returns 404 Not Found');


      const notFoundRes = await request('/non-existent-endpoint');
      assert(notFoundRes.status === 404 && notFoundRes.body.success === false, 'Unhandled route returns 404 Not Found');

      console.log(`\nTest Summary: ${passed} passed, ${failed} failed.\n`);
    } catch (error) {
      console.error('Test execution error:', error);
    } finally {
      server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
      });
    }
  });
}

runTests();
