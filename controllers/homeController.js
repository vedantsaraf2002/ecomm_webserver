const BigPromise = require('../middlewares/bigPromise')

exports.home = BigPromise(async (req,res) => {
    // const db = await something()
    res.status(200).json({
        success: true,
        greeting: "Hello from API",
    });
});
// if you don't want to use the function we made called BigPromise we have to use the try and catch block.
// for example let's use the try and catch alternative in the below function.

exports.dummy = async (req,res) => {
   try {
       // const db = await something()
    res.status(200).json({
        success: true,
        greeting: "Hello welcome to dummy route"
    })
   } catch (error) {
       console.log(error);  
   }
}
