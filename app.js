const axios = require('axios');
const cors = require('cors');
const serverless = require('serverless-http');
const express = require('express')
require('dotenv').config()

const app = express()

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const WHITE_LIST = [
	'http://localhost:8081',
	'https://greenliving.fr',
	'https://www.greenliving.fr',
	'https://storyjam.fr',
	'https://www.aurimatrix.com',
	'https://kapix-studio-dashboard-vue3-staging.netlify.app'
]
const BLACK_LIST_HEADERS = [
	"host",
	"origin",
	"connection",
	"cache-control",
	"accept",
	"upgrade-insecure-requests",
	"user-agent",
	"accept-encoding",
	"accept-language"
]

const HEADERS_TO_PASS = [
	'Content-type'
]

const PRIVATE_API_KEYS_MAP = {
	'kapix-brevo': [
	 	process.env.KAPIX_BREVO_API_KEY
	]
}


const corsOptions = {
  origin: function (origin, callback) {
		if (origin && (
			(
				(origin.startsWith('https://kapix-beta-') || origin.startsWith('https://kapix-business-')) && origin.endsWith('.netlify.app')
			) 
			|| origin.endsWith('.kapix.fr')
		)) {
			return callback(null, true)
		} else if (WHITE_LIST.includes(origin)) {
      return callback(null, true)
    } else { 
      return callback(new Error(`Not allowed by CORS : ${origin}`))
    }
  }
}

app.use(cors(corsOptions))
// app.use(cors({
// 	origin: '*',
// }))


function passHeaders (req) {
	const headers = {}
	HEADERS_TO_PASS.forEach(h => {
		headers[h] = req.get(h)
	})
	
	Object.entries(req.headers).forEach(([name, value]) => {
		if (!BLACK_LIST_HEADERS.includes(name.toLowerCase())) {
			if (typeof value === 'string' && (value.startsWith('[') || value.endsWith(']'))) {
				const apiKeyName = value.slice(1).slice(0, -1)
				console.log(`${value}: ${apiKeyName}`)
				const [newApiKeyName, newHeaderName] = apiKeyName.split('=>')
				console.log(`${newApiKeyName}: ${newHeaderName}`)
				const apiKeys = PRIVATE_API_KEYS_MAP[newApiKeyName]
				if (apiKeys) {
					const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)]
					console.log(`${newHeaderName || name} : ${apiKey}`)
					headers[newHeaderName || name] = apiKeys[Math.floor(Math.random() * apiKeys.length)]
				}
			} else {
				headers[name] = value
			}
		}
	})
	if(headers['Origin'] && headers['Origin'].includes('www.aurimatrix.com')) {
		req.headers["Authorization"] = process.env.AURIMATRIX_BREVO_API_KEY
	} else {
		headers['Origin'] = 'https://studio.kapix.fr'
	}
	headers['Access-Control-Allow-Origin'] = '*'
	headers['Access-Control-Allow-Crendentials'] = true
	console.log(`origin: ${req.headers.origin}`)
	console.log("new headers => ")
	console.log(headers)
	return {
		headers
	}
}

function printAxiosError (error) {
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
		printAxiosError(error)
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
		printAxiosError(error)
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
		printAxiosError(error)
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
		printAxiosError(error)
		res.status(400).send('BAD Request!')
		return
	}

	res.status(200).json(result.data)
})


exports.handler = serverless(app)	
// module.exports.handler = serverless(app)