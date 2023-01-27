/* Importing the express module and creating an instance of it. */
const express = require('express')
const app = express.Router()
const Usuario = require('../models/Usuario') // NUESTRO MODELO PARA PERMITIR GENERAR O MODIFICAR USUARIOS CON LA BASE DE DATOS
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const auth = require('../middlewares/authorization')

app.get('/obtener', async (req, res) => {
	try {
		const usuarios = await Usuario.find({})
		res.json({ usuarios })
	} catch (error) {
		res.status(500).json({ msg: 'Hubo un error obteniendo los datos' })
	}
})

// CREAR UN USUARIO JWT
app.post('/crear', async (req, res) => {
	const { username, email, password } = req.body // OBTENER USUARIO, EMAIL Y PASSWORD DE LA PETICIÓN

	try {
		// GENERAMOS STRING ALEATORIO PARA USARSE CON EL PASSWORD
		const salt = await bcryptjs.genSalt(10)
		const hashedPassword = await bcryptjs.hash(password, salt)

		// CREAMOS UN USUARIO CON SU PASSWORD ENCRIPTADO
		const respuestaDB = await Usuario.create({
			username,
			email,
			password: hashedPassword,
		})
		// USUARIO CREADO. VAMOS A CREAR EL JSON WEB TOKEN

		const payload = {
			user: {
				id: respuestaDB._id,
			},
		}

		// 2. FIRMAR EL JWT
		jwt.sign(
			payload, // DATOS QUE SE ACOMPAÑARÁN EN EL TOKEN
			process.env.SECRET, // LLAVE PARA DESCIFRAR LA FIRMA ELECTRÓNICA DEL TOKEN,
			{
				expiresIn: 360000, // EXPIRACIÓN DEL TOKEN
			},
			(error, token) => {
				// CALLBACK QUE, EN CASO DE QUE EXISTA UN ERROR, DEVUELVA EL TOKEN
				if (error) throw error
				// res.json(respuestaDB)
				res.json({ token })
			}
		)
	} catch (error) {
		return res.status(400).json({
			msg: error,
		})
	}
})

// INICIAR SESIÓN
app.post('/login', async (req, res) => {
	const { email, password } = req.body

	try {
		let foundUser = await Usuario.findOne({ email: email }) // ENCONTRAMOS UN USUARIO
		if (!foundUser) {
			// SI NO HUBO UN USUARIO ENCONTRADO, DEVOLVEMOS UN ERROR
			return res.status(400).json({ msg: 'El usuario no existe' })
		}

		// SI TODO OK, HACEMOS LA EVALUACIÓN DE LA CONTRASEÑA ENVIADA CONTRA LA BASE DE DATOS
		const passCorrecto = await bcryptjs.compare(password, foundUser.password)

		// SI EL PASSWORD ES INCORRECTO, REGRESAMOS UN MENSAJE SOBRE ESTO
		if (!passCorrecto) {
			return await res.status(400).json({ msg: 'Password incorrecto' })
		}

		// SI TODO CORRECTO, GENERAMOS UN JSON WEB TOKEN
		// 1. DATOS DE ACOMPAÑAMIENTO AL JWT
		const payload = {
			user: {
				id: foundUser.id,
			},
		}

		// 2. FIRMA DEL JWT
		if (email && passCorrecto) {
			jwt.sign(payload, process.env.SECRET, { expiresIn: 3600000 }, (error, token) => {
				if (error) throw error
				//SI TODO SUCEDIÓ CORRECTAMENTE, RETORNAR EL TOKEN
				res.json({ token })
			})
		} else {
			res.json({ msg: 'Hubo un error', error })
		}
	} catch (error) {
		res.json({ msg: 'Hubo un error', error })
	}
})

app.get('/verificar', auth, async (req, res) => {
	try {
		// CONFIRMAMOS QUE EL USUARIO EXISTA EN BASE DE DATOS Y RETORNAMOS SUS DATOS, EXCLUYENDO EL PASSWORD
		const usuario = await Usuario.findById(req.user.id).select('-password')
		res.json({ usuario })
	} catch (error) {
		// EN CASO DE ERROR DEVOLVEMOS UN MENSAJE CON EL ERROR
		res.status(500).json({
			msg: 'Hubo un error',
			error,
		})
	}
})

app.put('/actualizar', auth, async (req, res) => {
	const { nombre, email } = req.body
	try {
		const actualizacionUsuario = await Usuario.findByIdAndUpdate(req.user.id, { nombre, email }, { new: true })
		res.json(actualizacionUsuario)
	} catch (error) {
		res.status(500).json({
			msg: 'Hubo un error actualizando la Usuario',
		})
	}
})

app.get('/lista', auth, async (req, res) => {
	try {
		const uses = await Usuario.find({});
		res.json(uses)
	} catch (error) {
		res.status(500).json({
			msg: 'Hubo un error actualizando la Usuario',
		})
	}
})


//POSTEOS
app.put('/post', auth, async (req, res) => {
	const { id, post } = req.body

	try {
		const nuevoPost = await Usuario.findByIdAndUpdate(id, { $push: { post: post } })

		res.json(nuevoPost)
	} catch (error) {
		res.status(500).json({
			msg: 'Hubo un error creando el post del Usuario',
		})
	}
})

module.exports = app
