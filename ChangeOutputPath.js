export class ChangeOutputPath{
	apply(hooks){
		hooks.emitFile.tap("changeOutputPath", (context)=>{
			context.changeOutputPath("./dist/wzx.js")
			console.log("changeOutputPath");	
		})
	}
}