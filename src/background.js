browser.commands.onCommand.addListener(command => {
	console.log("command", command)
	browser.browserAction.openPopup()
})
