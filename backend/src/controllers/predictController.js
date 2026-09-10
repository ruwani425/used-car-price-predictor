const axios = require('axios');

const predictCarPrice = async (req, res) => {
  try {
    const { brand, year, mileage, fuel_type, transmission } = req.body;

    if (!brand || !year || !mileage || !fuel_type || !transmission) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // send data to the ML service for prediction
    const mlResponse = await axios.post(
      `${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/predict`,
      {
        brand,
        year: Number(year),
        mileage: Number(mileage),
        fuel_type,
        transmission
      }
    );

    return res.status(200).json({
      success: true,
      estimated_price: mlResponse.data.predicted_price
    });
  } catch (error) {
    console.error('ML Service Error:', error.message);
    return res.status(502).json({
      error: 'Failed to fetch prediction from ML service'
    });
  }
};

module.exports = { predictCarPrice };