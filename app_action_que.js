
class App_Action_que {

	constructor(){

		this.que = {}

		this.debug = false
	}

	add( name, cancelling_or_function, func ){

		func = typeof(cancelling_or_function)=='function' ? cancelling_or_function : func

		let cancelling = typeof(cancelling_or_function)=='object' ? cancelling_or_function : []

		let action_in_progress = this.que[this.in_progress]

		if(typeof action_in_progress == 'object' && action_in_progress.cancelling.indexOf(name)>=0)
		{
			if(this.debug) console.log('cancelled: '+name+' (by '+this.in_progress+')')

			return false
		}

		if(this.debug) console.log('qued', name, 'cancelling: '+(cancelling.join(', ')||'-'))

		this.que[name] = { func, cancelling }
		
		this.process()
	}

	remove( action_name ){

		if(this.in_progress == action_name)
		{
			delete this.que[action_name]

			this.in_progress = null

			if(this.debug) console.log('de-qued: '+name)
		}

		this.process()
	}


	process(){

		if(typeof this.in_progress == 'string')
		{
			if(this.debug) console.log('skipped proccessing as action still in progress: '+this.in_progress)
			return true
		}

		for(var name in this.que)
		{
			if(typeof(this.que[name].func) == 'function')
			{
				this.in_progress = name

				this.que[name].func(()=>this.remove(name))

				if(this.debug) console.log('executed action: '+name)
				return false
			}
		}
	}
}
