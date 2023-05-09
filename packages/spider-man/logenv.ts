import dotent from 'dotenv'

dotent.config()

console.log('API_ENV:', process.env.API_ENV)
console.log('OSS_REGION:', process.env.OSS_REGION)
