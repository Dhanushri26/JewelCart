const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();

// Load the Swagger YAML file
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Serve Swagger UI at the /docs endpoint
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Optional: redirect root to /docs
app.get('/', (req, res) => {
    res.redirect('/docs');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Swagger UI is now available at http://localhost:${PORT}/docs`);
});

