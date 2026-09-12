const express = require("express");
const router = express.Router();
const { handleGetMetadata } = require("../controllers/metadataController");

// GET /api/metadata
router.get("/", handleGetMetadata);

module.exports = router;
