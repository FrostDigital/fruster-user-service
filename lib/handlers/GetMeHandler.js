class GetMeHandler {

	async handleHttp({ user }) {
		return {
			status: 200,
			data: user
		};
	}

}

module.exports = GetMeHandler;
