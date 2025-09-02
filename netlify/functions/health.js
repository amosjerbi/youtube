exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status: 'OK',
      message: 'Server is running on Netlify',
      timestamp: new Date().toISOString()
    })
  };
};
