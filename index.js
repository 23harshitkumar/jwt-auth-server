// This file was previously created for just learning purposes. For main code, refer to example.js

const express = require("express")
const app = express()
const zod = require("zod")

const schema = zod.array(zod.number())

app.use(express.json())

app.post("/health-checkup", (req,res) => {
    // (request body) kidneys = [1,2]
    const kidneys = req.body.kidneys
    const result = schema.safeParse(kidneys)

    if (!result.success) {
        return res.status(400).send({
            success: false,
            error: result.error.errors
        });
    }
    res.send({
        result
    })
})

app.listen(3000, ()=>{
    console.log("Server running on 3000")
})
