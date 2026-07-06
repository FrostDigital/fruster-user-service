declare module "csprng" {
	function secureRandom(bits: number, radix: number): string;
	export = secureRandom;
}
