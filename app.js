
// 2021-06-24 TP: Cool/crazy shit -- it won't scale, i'm quite sure, unfortunately

class app_instance
{

	constructor(){

		this.debug = false

		this.type_save_delay = 500

		this.new_note_default = { title: '', subtitle: '', edit_date: '', 'contents': '', idx: 0, has_converted_listitems: false }

		this.state = {
			uid: '',
			sidebar_left_open: true,
			sidebar_right_open: true,
			menu_search_open: false,
			notes: [ { ...this.new_note_default } ],
			open_note: 0,
			layer: 'welcome',
			show_error_message: false,
			loading: false
		}

		this.rendered_state = {}
	}

	init(){

		this.welcome_layer = $('.welcome')
		this.app_layer = $('.app')
		this.settings_layer = $('.settings')

		this.error_message = $('.error_message')

		this.menu = $('.menu')
		this.sidebar_left = $('.sidebar-left')
		this.textarea = $('.app > .jodit_container')
		this.sidebar_right = $('.sidebar-right')

		// this.sidebar_right.resizable({ handles: 'w', maxWidth: 500 })

		this.textarea_jodit = new Jodit('.jodit_container', {

			i18n: 'en',
			colors: {
				greyscale:  ['#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF'],
				palette:    ['#980000', '#FF0000', '#FF9900', '#FFFF00', '#00F0F0', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF'],
				full: [
					'#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
					'#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
					'#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
					'#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
					'#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#733554',
					'#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130'
				]
			},
			colorPickerDefaultTab: 'text',
			removeButtons: [ 'cut', 'left', 'source' ],
			disablePlugins: [ 'iframe' ],
			sizeLG: 900,
			sizeMD: 700,
			sizeSM: 400,
			buttons: [
				'bold', 'underline', 'italic', 'strikethrough', '|',
				'ul', 'ol', '|',
				'indent', 'outdent', '|',
				/*'font',*/ 'fontsize', 'brush', 'paragraph', '|',
				/*'image', 'video',*/ 'table', 'link', '|',
				'hr', 'eraser', /*'copyformat',*/ '|',
				//'symbol'
			],
			"uploader": { "insertImageAsBase64URI": true },
			// "allowResizeX": true,
			"showCharsCounter": false,
			"showWordsCounter": false,
			"showXPathInStatusbar": false,
			"preset": "inline",
			"defaultActionOnPaste": "insert_as_html", // INSERT_AS_HTML,  INSERT_AS_TEXT, INSERT_CLEAR_HTML, INSERT_ONLY_TEXT
			"askBeforePasteHTML": false,
			"askBeforePasteFromWord": false,
			"indentMargin": 15
		})


		this.textarea = $('.jodit_wysiwyg')


		this.action_que = new App_Action_que()


		this.state_load_saved(()=>{

			this.state_render()

			this.window_response_handle()

			this.bind_event_handlers()

			this.sidemap_render()

		})

		return this
	}


	window_response_handle(){

		let window_small_size = $(window).width()<=992

		$('html').toggleClass('window-size-small', window_small_size)

		$(window).on('resize', ()=>{

			window_small_size = $(window).width()<=992

			$('html').toggleClass('window-size-small', window_small_size)

			if(window_small_size)
			{

			}
		})


		this.sidebar_left.on('mouseover click scroll', ()=>{

			this.app_layer.removeClass('sidebar-right-priority')
			this.app_layer.addClass('sidebar-left-priority')
		})

		this.sidebar_left.on('mouseout', ()=>{

			this.app_layer.removeClass('sidebar-left-priority')
		})


		this.sidebar_right.on('mouseover click scroll', ()=>{

			this.app_layer.removeClass('sidebar-left-priority')
			this.app_layer.addClass('sidebar-right-priority')
		})


		this.sidebar_right.on('mouseout', ()=>{

			this.app_layer.removeClass('sidebar-right-priority')
		})

		this.textarea.on('mouseover click', ()=>{

			this.app_layer.removeClass('sidebar-left-priority sidebar-right-priority')
		})


	}


	init_new( overwrite = false ){

		if(!this.state.uid || overwrite) this.state_set({ uid: this.generate_uid() })
	}


	generate_uid() {

		let d = new Date().getTime()

		if (typeof performance !== 'undefined' && typeof performance.now === 'function')
			d += performance.now() //use high-precision timer if available

		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			
			let r = (d + Math.random() * 16) % 16 | 0
			
			d = Math.floor(d / 16)

			return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
		})
	}



	state_set( state = {}, trigger_render = true, trigger_save = true, cb ){

		if(typeof state == 'boolean') { let _state = state; state = trigger_render, trigger_render = _state; }

		if(typeof trigger_save == 'function') cb = trigger_save


		this.state = $.extend(true, this.state, state)


		if(trigger_render) this.state_render(cb)

		if(trigger_save) this.state_save()


		if(typeof cb == 'function') cb()
	}

	state_save(){

		localStorage.setItem('NinjaNotes_State', JSON.stringify(this.state))
	}

	state_load_saved(cb){

		let saved_state = localStorage.getItem('NinjaNotes_State');

		if(typeof saved_state == 'string' && saved_state.length>1)
		{
		    try {
		        let saved_state_parsed = JSON.parse(saved_state)

				this.state = $.extend(true, this.state, saved_state_parsed)

		    } catch (e) {

		        return this.state_set({ show_error_message: `

	        		Your saved data could not be loaded.
	        		Probably a data-corruption issue.

	        		${!e ? '' : `

		        		The error:
		        		<pre>${e}</pre>
	        		`}

	        		It 's reccomended; that you download your data now, as a back-up and for the possibility of restoring it.

	        		<a class="download-saved-state-data" href="data:text/plain;charset=utf-8,${encodeURIComponent(saved_state)}" download="data.json.txt">Click here to download the data</a>

	        		Please free feel to contact for support on the@back-end.ninja.

	        		If you fix the data youself, you can import it to this application again, using this code via your browser developer tools > console:
	        		<pre>app.state = &lt;THE_JSON_DATA_HERE&gt;${"\n"}app.state_save()${"\n"}app.state_render()</pre>
	        		And reload the window

		        `}, true, false);
		    }
		}

		if(typeof cb == 'function') cb()
	}



	state_render(){

		$.each(this.state, (k, v)=>typeof(this['state_render_'+k])=='function'&&JSON.stringify(this.rendered_state[k])!=JSON.stringify(v) ? this['state_render_'+k]() : true)

		this.rendered_state = $.extend(true, {}, this.state)
	}

	state_render_layer(){

		let layers = { welcome: this.welcome_layer, app: this.app_layer, settings: this.settings_layer }

		if(typeof layers[this.state.layer] == 'undefined') return true

		$('body > *').removeClass('shown')

		layers[this.state.layer].addClass('shown').scrollTop(0)
	}

	state_render_sidebar_left_open(){

		this.app_layer.toggleClass('sidebar-left-open', this.state.sidebar_left_open)

		this.menu.find('.sidebar-toggle-left').toggleClass('active',this.state.sidebar_left_open)
	}

	state_render_sidebar_right_open(){

		this.app_layer.toggleClass('sidebar-right-open', this.state.sidebar_right_open)

		this.menu.find('.sidebar-toggle-right').toggleClass('active', this.state.sidebar_right_open)
	}

	state_render_menu_search_open(){

		this.app_layer.toggleClass('menu-search-open', this.state.menu_search_open)

		this.menu.find('.search-dialog-toggle').toggleClass('active',this.state.menu_search_open)


		let search_dialog_container = this.menu.find('.search-dialog')
		
		if(!this.state.menu_search_open)
		{
			search_dialog_container.remove()
		}
		else if(search_dialog_container.length == 0)
		{
			let search_dialog_container = $(`

				<div class="search-dialog">

					<input type="text" name="searchtext" class="" />
					
					<div class="btn btn-search"> <i class="fa fa-search"></i> </div>
					
					<div class="btn btn-cancel"> <i class="fa fa-times"></i> </div>
				</div>
			`)

			this.menu.append(search_dialog_container)
		}		
	}

	state_render_open_note(){

		$('.open-note').removeClass('current')
		$('.open-note[data-id="'+(this.state.open_note)+'"]').addClass('current')

		if(typeof(this.state.notes[this.state.open_note])!='object')
			console.warn('typeof this.state.notes[this.state.open_note] != object')
		else if(typeof(this.state.notes[this.state.open_note].contents) != 'string')
			console.warn('typeof this.state.notes[this.state.open_note].contents != string')
		else
			this.textarea_jodit.value = this.state.notes[this.state.open_note].contents

		// this.state_render_notes()
	}

	state_render_notes(){

		let notes = $.extend(true,[],this.state.notes)

		notes = notes.filter((n)=>typeof(n)=='object' && n != null)

		// Cover up, empty notes
		notes = notes.filter((n)=>n.idx == this.state.open_note || n.contents!=="")

		notes = notes.sort((a, b)=>b.edit_date-a.edit_date)

		this.sidebar_left.empty().append(notes.map((n) => `

			<div class="item open-note ${n.idx==this.state.open_note?'current':''}" data-id="${n.idx}">

				<div class="title">${n.title || '<span class="none"> - </span>'}</div>
				<div class="subtitle">${n.subtitle || '<span class="none"> - </span>'}</div>
			</div>
		`))


		// this.sidemap_render()
	}


	state_render_show_error_message(){
		
		if(this.state.show_error_message)
		{
			this.error_message.html(`

				<h2>Sorry</h2>

				${this.state.show_error_message.replace(new RegExp("\n",'g'),'<br>')}
			`)
			
			this.error_message.addClass('shown')
		}
		else
			this.error_message.removeClass('shown')
	}


	bind_event_handlers(){

		$(document).on('click', '.app-start', ()=> !this.state.uid ? this.init_new() : this.state_set({layer:'app'}) )

		$(document).on('click', '.sidebar-toggle-left', ()=> this.sidebar_left_toggle() )

		$(document).on('click', '.sidebar-toggle-right', ()=> this.sidebar_right_toggle() )

		$(document).on('click', '.open-note', (e)=> this.note_open($(e.currentTarget).data('id')) )

		$(document).on('click', '.create-new-note', ()=> this.note_new() )

		$(document).on('click', '.goto-layer-welcome', ()=> this.state_set({layer:'welcome'}) )

		$(document).on('click', '.goto-settings', ()=> this.state_set({layer:'settings'}) )

		$(document).on('click', '.search-dialog-toggle', ()=> this.search_dialog_toggle() )

		$(document).on('click', '.search-dialog .btn-cancel', ()=> this.search_dialog_toggle() )

		$(document).on('keydown', (e)=> { if(e.keyCode == 83 && (e.metaKey||e.ctrlKey)){ e.preventDefault(); this.note_save() } })

		this.textarea_jodit.events.on('keydown', (e,d)=> this.on_keydown(e,d))

		this.textarea_jodit.events.on('keyup', (e)=> this.on_keyup(e))

		this.textarea_jodit.events.on('change', (e)=> this.on_change(e))

		this.textarea_jodit.events.on('paste', (e)=> this.on_paste(e))

		this.textarea.on('contextmenu', (e)=> this.on_contextmenu(e))

		this.sidebar_right.on('resizestop', ()=> {

			console.log('DONE, ', e)
		})
	}



	sidebar_left_toggle(){

		this.state_set({ sidebar_left_open: !this.state.sidebar_left_open })
	}


	sidebar_right_toggle(){

		this.state_set({ sidebar_right_open: !this.state.sidebar_right_open })
	}


	search_dialog_toggle(){

		this.state_set({ menu_search_open: !this.state.menu_search_open })
	}


	sidebar_left_toggle(){

		this.state_set({ sidebar_left_open: !this.state.sidebar_left_open })
	}


	on_keydown(e,d){

		if(e.keyCode == 9)
		{
			console.log(e,d)

			e.preventDefault()

			this.textarea_jodit.execCommand(e.shiftKey ? 'outdent' : 'indent')
		}
		else if(e.keyCode == 88 && (e.metaKey || e.ctrlKey)) // clip
		{
			let selection = window.getSelection()

			let ancher_elem = $(selection.anchorNode).parent()

			let is_textarea_container = ancher_elem.is('.jodit_wysiwyg')

			console.log(selection)

			/*
			if(is_textarea_container)
			{
				console.log(is_textarea_container, ancher_elem, selection.anchorNode)

				e.preventDefault()

				return false
			}
			else */
			let offset_accum = selection.focusOffset+selection.extentOffset

			if(offset_accum>0 && selection.baseOffset==selection.extentOffset && !is_textarea_container)
			{
				e.preventDefault()

				if(is_textarea_container)
				{

					console.log('ancher_elem.remove()',ancher_elem)//ancher_elem.empty()
				}
				else
				{
					this.element_text_select(ancher_elem)

					document.execCommand("copy")

					ancher_elem.remove()
				}

				return false
			}
		}
	}


	on_keyup(e){

		let selection = window.getSelection()
		let ancher_elem = $(selection.anchorNode).parent()

		if(selection.baseOffset==selection.extentOffset)
		{

			if(e.key.length==1 && (ancher_elem.text().substring(0,2) == "- " || ancher_elem.text().substring(0,2) == "- ") && !ancher_elem.is('li'))
			{
				if(this.debug) console.log('insertUnorderedList')

				this.textarea_jodit.execCommand('insertUnorderedList')

				selection = window.getSelection()
				ancher_elem = $(selection.anchorNode).parent()

				let ancher_elem_html = ancher_elem.html()

				if(ancher_elem_html.substring(0,7)=='-&nbsp;')
					ancher_elem.html( ancher_elem.html().substring(7) )

				else if(ancher_elem_html.substring(0,2)=='- ')
					ancher_elem.html( ancher_elem.html().substring(2) )

				else if(ancher_elem_html.substring(0,2)=="- ")
					ancher_elem.html( ancher_elem.html().substring(2) )
			}
		}
	}

	on_contextmenu(e){

		// e.preventDefault()

		console.log('on_contextmenu')
	}



	on_paste(e){


		console.log('paste', e)

		this.note_convert_listitems()
	}



	element_text_select(element) {

	    let doc = document,
	    	text = element instanceof jQuery ? element[0] : element,
	    	range,
	    	selection

	    if (doc.body.createTextRange) {
	        range = document.body.createTextRange();
	        range.moveToElementText(text);
	        range.select();
	    } else if (window.getSelection) {
	        selection = window.getSelection();        
	        range = document.createRange();
	        range.selectNodeContents(text);
	        selection.removeAllRanges();
	        selection.addRange(range);
	    }
	    else console.log('FUCK')
	}






	on_change(){

		this.action_que.add('typing', (on_done)=>{

			clearTimeout(this.on_key_up_lazy_timeout)

			this.on_key_up_lazy_timeout = setTimeout(
				()=>{

						this.note_save()

						on_done()
				},
				this.type_save_delay
			)
		})
	}




	sidemap_render(){

		let content_elements = this.textarea.find(' > *')

		if(content_elements.length==0)
		{
			this.sidebar_right.html('').addClass('empty')

			if(this.debug) console.log('sidemap_render: Skipped')

			return
		}

		this.sidebar_right.removeClass('empty')


		let groups = []

		let current_group = { type: 'beginning', level: 0, contents: [] }


		let funct_form_group = ( group_elem )=>{

			let group_level = 1

			let title_child_span = group_elem.find('>span')

			if(this.debug && title_child_span.length>1) console.warn('Found title_child_span.length>1');

			if(title_child_span.length>0)
			{
				group_level = parseInt(title_child_span.first().css('font-size'))/8
			}

			return {
				type: 'title',
				title: group_elem.text(),
				level: group_level,
				contents: []
			}
		}

		let funct_form_group_content_text = ( textcontent )=>{

			return { type: 'text', contents: textcontent }
		}

		let funct_form_group_content_list = ( children )=>{

			let items_count = children.length

			return { type: 'list', items_count }
		}

		content_elements.filter(':not(title)').each((i,_elem)=>{

			let elem = $(_elem)

			let elem_tag_name = elem.prop("tagName").toLowerCase()

			let children =  elem.children()
			let children_length = children.length

			let group_contents_i = current_group.contents.length
			let prev_group = group_contents_i>0 ? current_group.contents[group_contents_i-1] : null



			if(children_length==0)
			{
				let textcontent = elem.text()

				if(textcontent.length>0)
				{
					if(prev_group && prev_group.type == 'text')
					{
						current_group.contents[group_contents_i-1].contents += "\n"+textcontent
					}
					else
					{
						current_group.contents.push(funct_form_group_content_text(textcontent))
					}
				}
			}
			else
			{
				if(elem_tag_name == 'ul')
				{
					if(children.length > 0)
					{
						if(prev_group && prev_group.type == 'list')
						{
							current_group.contents[group_contents_i-1].items_count += children.length
						}
						else
						{
							current_group.contents.push(funct_form_group_content_list(children))
						}
					}
				}
				else
				{

					children.each((i,_child)=>{

						let child_elem = $(_child)

						let child_tag_name = child_elem.prop("tagName").toLowerCase()



						// Title - new group

						if(child_tag_name == 'strong')
						{
							let child_text = child_elem.text()

							if(child_elem.text().length>0)
							{
								if(current_group.contents.length>0)
									groups.push(current_group)

								current_group = funct_form_group(child_elem)
							}

						}

						else if(child_tag_name == 'ul')
						{
							current_group.contents.push(funct_form_group_content_list(child_elem.children()))
						}



					})
				}
			}
		})

		groups.push(current_group)


		console.log('groups', groups)


		let render_map_html = (_contents)=>{

			let _map_html = ''

			$(_contents).each((i,_content)=>{

				if(typeof _content != 'object') return true

				if(_content.type == 'title')
				{
					_map_html += `<div class="group group-${_content.type}">`
					_map_html += `<div class="group group-title">${_content.title}</div>`
				}

				if(_contents.type == 'text')
				{
					_map_html += `<div class="group group-${_content.type}">[...]</div>`
				}

				if(_contents.type == 'list')
				{
					_map_html += `<div class="group group-${_content.type}">Liste med ${_contents.items_count} punkter</div>`
				}


				if(typeof _content.contents == 'object')
					$.each(_content.contents,(i2,_contents2)=>_map_html += render_map_html(_contents2))

				if(_content.type == 'title')
					_map_html += `</div>`
			})

			return _map_html
		}

		this.sidebar_right.html('<div class="map">'+render_map_html(groups)+'</div>')
	}



	note_open( id ){


		if(id != this.state.open_note)
			this.app_layer.removeClass('sidebar-left-priority sidebar-right-priority')


		this.action_que.add('open', ['typing'], (on_done)=>{


			if(id != this.state.open_note)
			{
				this.state_set({ open_note: id })

				this.sidemap_render()

				this.textarea.focus()
			}

			on_done()
		})
	}

	
	note_new(){

		let idx = this.state.notes.length

		this.state.notes[idx] = {...this.new_note_default, edit_date: (new Date()).getTime(), idx }

		this.note_open(idx)
	}

	note_save(){

		if(typeof(this.state.notes[this.state.open_note]) != 'object') return console.warn("typeof(this.state.notes["+this.state.open_note+"]) != 'object')");

		let contents = this.textarea_jodit.getEditorValue()
		let contents_is_html = $('<div>'+contents+'</div>').children().length > 0
		let init_content_texts = []

		if(!contents_is_html) init_content_texts = [ contents, '' ]
		else
			$(contents).each((i,e)=>{

				if((e = $(e).text().trim()) && e.length>0)
				{
					if(!init_content_texts[0])
						init_content_texts[0] = e
					else
					{
						init_content_texts[1] = e

						return false
					}
				}
			})


		this.state.notes[this.state.open_note].contents = contents

		this.state.notes[this.state.open_note].edit_date = (new Date()).getTime()

		this.state.notes[this.state.open_note].title = init_content_texts[0]
		this.state.notes[this.state.open_note].subtitle = init_content_texts[1]

		this.state_set()

		if(this.debug) console.log('Saved note')
	}
	


	note_convert_listitems(){

		this.action_que.add('convert_listitems', (on_done)=>{

			let base_children = this.textarea.children()

			if(base_children.length > 0)
			{
				let elems = base_children.filter(':contains(- ):not(ul)')

				elems.each((i,e)=>{

					let span = $(e).find('span')

					let indent_level = span.length==0 ? 1 : (span.html().match(/&nbsp;/g) || []).length

					span.remove()

					let new_html = $(e).html()

					if(new_html.substring(0,2) == '- ') new_html = new_html.substring(2)
					if(new_html.substring(0,3) == ' - ') new_html = new_html.substring(3)

					let li_elem = $('<li>'+new_html+'</li>').css('margin-left', ((indent_level-1)*10)+'px')

					if($(e).prev().is('ul'))
						$(e).prev().append(li_elem)
					else
						$(e).before( $('<ul></ul>').append(li_elem) )

					$(e).remove()

				})
			}

			on_done()

		})
	}

}



window.app = (new app_instance()).init()




