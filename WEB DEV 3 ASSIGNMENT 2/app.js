const express = require('express');
const logger = require('./middleware/logger');
const studentRoutes = require('./routes/studentRoutes');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(logger);


app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Student Management REST API',
    endpoints: {
      getAllStudents: 'GET /students',
      getStudentById: 'GET /students/:id',
      createStudent: 'POST /students',
      updateStudent: 'PUT /students/:id',
      deleteStudent: 'DELETE /students/:id'
    }
  });
});

app.use('/students', studentRoutes);


app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error('[Error Details]:', err.stack || err.message);


  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload provided in request body.'
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Student Management API running on port ${PORT}`);
    console.log(` Server URL: http://localhost:${PORT}`);
    console.log(`===============================================`);
  });
}

module.exports = app;
