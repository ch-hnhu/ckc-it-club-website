declare module "jsvectormap" {
	export interface JsVectorMapOptions {
		selector: string;
		map: string;
	}

	export default class jsVectorMap {
		constructor(options: JsVectorMapOptions);
		destroy(): void;
	}
}

declare module "jsvectormap/dist/maps/world.js";
