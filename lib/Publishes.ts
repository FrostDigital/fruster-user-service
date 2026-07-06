import bus from "@fruster/bus";

class Publishes {
	static get subjects() {
		return { USER_DELETED: "pub.user-service.user-deleted" };
	}

	static async userDeleted(reqId: string | undefined, userId: string): Promise<void> {
		bus.publish({
			subject: Publishes.subjects.USER_DELETED,
			message: { reqId, data: { userId } }
		});
	}
}

export default Publishes;
