const axios = require("axios")

module.exports = {
  config: {
    name: "apitest",
    author: "None",
    countDown: 5,
    role: 2,
    category: "admin"
  },
  onStart: async function({message, args, event}) {
    const url = args[1];
    const mode = args[0]
    
    
    if(!['get', 'post'].includes(mode)) return message.reply("invalid")
    
    if(!url) return message.reply("[!] Invalid Url!");

    
    try {
      
      switch(mode) {
        case 'get': {
          const responseType = args[2];
          if(responseType == "image") {
            const {data: img } = await axios.get(url, {responseType: "stream"})
            return message.reply({body: "Response:", attachment: img})
          } else {
            const {data} = await axios.get(url)
            return message.reply(`The endpoint returned:\n\n ${JSON.stringify(data,null,2)}`)
          }
        }
      }
      
      
      
    } catch (e) {
      console.error(e)
      return message.reply("An error occurred!\nError: " + e.message)
    }
  }
}
