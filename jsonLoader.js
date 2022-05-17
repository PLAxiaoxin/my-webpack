// loader 为倒序执行
export function jsonLoader(source){
	this.addDeps("jsonLoader");
	return `export default ${JSON.stringify(source)}`;
}