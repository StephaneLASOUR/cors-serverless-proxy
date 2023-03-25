const axios = require('axios');
const cors = require('cors');
const serverless = require('serverless-http');
const express = require('express')

const app = express()

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const whitelist = [
	'http://localhost:8081',
	'https://studio.kapix.fr',
	'https://studio-business.kapix.fr'
]

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.includes(origin)) {
      return callback(null, true)
    } else {
      return callback(new Error('Not allowed by CORS'))
    }
  }
}

// app.use(cors(corsOptions))
app.use(cors({
	origin: '*',
}))

const headersToPass = [
	'Content-type',
	'Authorization',
]

function passHeaders (req) {
	const headers = {}
	headersToPass.forEach(h => {
		headers[h] = req.get(h)
	})
	headers['Access-Control-Allow-Origin'] = '*'
	headers['Origin'] = 'https://studio.kapix.fr'
	return {
		headers
	}
}

function printAxioError (error) {
	if ('The request was made and the server responded with a status code', error.response) {
		// The request was made and the server responded with a status code
		// that falls out of the range of 2xx
		console.log(error.response.data);
		console.log(error.response.status);
		console.log(error.response.headers);
	} else if (error.request) {
		// The request was made but no response was received
		// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
		// http.ClientRequest in node.js
		console.log('The request was made but no response was received', error.request);
	} else {
		// Something happened in setting up the request that triggered an Error
		console.log('Error', error.message);
	}
}

// GET proxy
app.get('/proxy', async(req, res) => {
	if(req.method !== 'GET') {
		return res.status(401).json({
				message: 'Not allowed'
		})
	}
	const url = req.query.url
	if (!url) {
		return res.status(400).json({
			message: 'Url must not be empty'
		})
	}
	let result
	try {
		result = await axios.get(url, passHeaders(req))
	} catch (error) {
		printAxioError(error)
		res.status(400).send('BAD Request!')
		return
	}

	res.status(200).json(result.data)
})

// POST proxy
app.post('/proxy', async(req, res) => {
	if(req.method !== 'POST') {
		return res.status(401).json({
			message: 'Wrong Method - Not allowed'
		})
	}
	const url = req.query.url
	if (!url) {
		return res.status(400).json({
			message: 'Url must not be empty'
		})
	}
	const data = req.body
	let result
	try {
		result = await axios.post(url, data, passHeaders(req))
	} catch (error) {
		printAxioError(error)
		res.status(400).send('BAD Request!')
		return
	}

	res.status(200).json(result.data)
})

// PUT proxy
app.put('/proxy', async(req, res) => {
	if(req.method !== 'PUT') {
		return res.status(401).json({
			message: 'Wrong Method - Not allowed'
		})
	}
	const url = req.query.url
	if (!url) {
		return res.status(400).json({
			message: 'Url must not be empty'
		})
	}
	const data = req.body
	let result
	try {
		result = await axios.put(url, data, passHeaders(req))
	} catch (error) {
		printAxioError(error)
		res.status(400).send('BAD Request!')
		return
	}

	res.status(200).json(result.data)
})

// DELETE Proxy
app.delete('/proxy', async(req, res) => {
	if(req.method !== 'DELETE') {
		return res.status(401).json({
			message: 'Wrong Method - Not allowed'
		})
	}
	const url = req.query.url
	if (!url) {
		return res.status(400).json({
			message: 'Url must not be empty'
		})
	}
	let result
	try {
		result = await axios.delete(url, passHeaders(req))
	} catch (error) {
		printAxioError(error)
		res.status(400).send('BAD Request!')
		return
	}

	res.status(200).json(result.data)
})


exports.handler = serverless(app)	
// module.exports.handler = serverless(app)