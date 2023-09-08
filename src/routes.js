const router = require('express').Router()
const userController = require('./controllers/userController')
const bodyParser = require('body-parser')
const multer = require('multer');

const bodyJson = bodyParser.json()

const cors = require('cors')

router.use(cors())

router.post('/', bodyJson, userController.recebeDados)
router.get('/consultar', bodyJson, userController.consultaDados)
router.post('/validar', bodyJson, userController.validarDados)
router.post('/atualizar', bodyJson, userController.atualizarDados)

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './src/csv');
    },
    filename: (req, file, cb) => {
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const nameAntigo = file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]
     
      cb(null, 'atualizacao_preco_exemplo.csv');

    },
  });
  
  const upload = multer({ storage });
  
  router.post('/upload', upload.single('file'), userController.resultUpload);

module.exports = router 