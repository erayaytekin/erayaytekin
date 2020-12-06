const { create, Client } = require('@open-wa/wa-automate')
const figlet = require('figlet')
const options = require('./utils/options')
const { color, messageLog } = require('./utils')
const HandleMsg = require('./HandleMsg')

const start = (aruga = new Client()) => {
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('TURKCE BOT', { font: 'Ghost', horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color('[DEV]'), color('Powered by Eray', 'yellow'))
    console.log(color('[~>>]'), color('BOT başladı!', 'green'))

    // Mempertahankan sesi agar tetap nyala
    aruga.onStateChanged((state) => {
        console.log(color('[~>>]', 'red'), state)
        if (state === 'CONFLICT' || state === 'BAŞLATILMAMIŞ') aruga.forceRefocus()
    })

    // ketika bot diinvite ke dalam group
    aruga.onAddedToGroup(async (chat) => {
	const groups = await aruga.getAllGroups()
	// kondisi ketika batas group bot telah tercapai,ubah di file settings/setting.json
	if (groups.length > groupLimit) {
	await aruga.sendText(chat.id, `Grup girme davetiniz kontrol edilecektir... \ nMax Group: $ {groupLimit}`).then(() => {
	      aruga.leaveGroup(chat.id)
	      aruga.deleteChat(chat.id)
	  }) 
	} else {
	// kondisi ketika batas member group belum tercapai, ubah di file settings/setting.json
	    if (chat.groupMetadata.participants.length < memberLimit) {
	    await aruga.sendText(chat.id, `Üzgünüz, grup üye sayısı istenilenden azdır eğer yine de girmemi isterseniz özelden grup linki atınız. ${memberLimit} people`).then(() => {
	      aruga.leaveGroup(chat.id)
	      aruga.deleteChat(chat.id)
	    })
	    } else {
        await aruga.simulateTyping(chat.id, true).then(async () => {
          await aruga.sendText(chat.id, `Merhaba Grup ~, Ben BOT. Bu bot üzerindeki komutları öğrenmek için ${prefix}menu`)
        })
	    }
	}
    })

    // ketika seseorang masuk/keluar dari group
    aruga.onGlobalParicipantsChanged(async (event) => {
        const host = await aruga.getHostNumber()
        // kondisi ketika seseorang diinvite/join group lewat link
        if (event.action === 'add' && event.who !== host) {
            await aruga.sendTextWithMentions(event.chat, `MERHABA, Grubumuza hoşgeldiniz \n\nUmarım iyi bir vakit geçirirsiniz✨`)
        }
        // kondisi ketika seseorang dikick/keluar dari group
        if (event.action === 'remove' && event.who !== host) {
            await aruga.sendTextWithMentions(event.chat, `Hoşça kal @${event.who.replace('@c.us', '')}, Seni özleyeceğiz.✨`)
        }
    })

    aruga.onIncomingCall(async (callData) => {
        // ketika seseorang menelpon nomor bot akan mengirim pesan
        await aruga.sendText(callData.peerJid, 'Üzgünüm, telefona cevap veremiyorum ENGEL!..\n\n-bot')
        .then(async () => {
            // bot akan memblock nomor itu
            await aruga.contactBlock(callData.peerJid)
        })
    })

    // ketika seseorang mengirim pesan
    aruga.onMessage(async (message) => {
        aruga.getAmountOfLoadedMessages() // menghapus pesan cache jika sudah 3000 pesan.
            .then((msg) => {
                if (msg >= 3000) {
                    console.log('[aruga]', color(`Yüklenen Mesaj Erişimi $ {msg}, mesaj önbelleği siliniyor ...`, 'yellow'))
                    aruga.cutMsgCache()
                }
            })
        HandleMsg(aruga, message)    
    
    })
	
    // Message log for analytic
    aruga.onAnyMessage((anal) => { 
        messageLog(anal.fromMe, anal.type)
    })
}

//create session
create(options(true, start))
    .then((aruga) => start(aruga))
    .catch((err) => new Error(err))
