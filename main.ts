import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { format } from 'path';
const WolframAlphaAPI = require('wolfram-alpha-api');


// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	Appid: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	Appid: ''
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;



	async onload() {
		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'evaluate',
			name: 'Evaluate the math',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let text = editor.getSelection();

				if (this.settings.Appid === '') {
					new Notice('You need to set an Appid in the settings.');
					return false;
				}
				let waApi = WolframAlphaAPI(this.settings.Appid);

				if (text) {
					// Do something with the text
					waApi.getFull({
						input: text,
						includepodid: "Result",
						format: "plaintext"
					}).then((queryresult: any) => {
						console.log(queryresult);
						const pods = queryresult.pods;
						console.log(pods[0].subpods[0].plaintext);
						new Notice(pods[0].subpods[0].plaintext);
					})
				} else {
					new Notice('No text selected.', 2000);
				}
			}


		});

		this.addCommand({
			id: 'graph',
			name: 'Get a graph of the math',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let text = editor.getSelection();

				if (this.settings.Appid === '') {
					new Notice('You need to set an Appid in the settings.');
					return false;
				}
				let waApi = WolframAlphaAPI(this.settings.Appid);

				if (text) {
					// Do something with the text
					waApi.getFull({
						input: text,
						includepodid: "Plot",
						format: "image"
					}).then((queryresult: any) => {
						console.log(queryresult);
						if (queryresult.numpods === 0) {
							new Notice('No plot found.');
							return;
						}
						const pods = queryresult.pods;
						let graphLink = pods[0].subpods[0].img.src
						navigator.clipboard.writeText(`<img src="${graphLink}">`).then(() => {
							new Notice(`Image html has been copied to your clipboard`, 5000);
						});
					})

				} else {
					new Notice('No text selected.', 2000);
				}
			}
		});



		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

		new Setting(containerEl)
			.setName('Appid')
			.setDesc('Your Wolfram Alpha Appid')
			.addText(text => text
				.setPlaceholder('Enter your id')
				.setValue(this.plugin.settings.Appid)
				.onChange(async (value) => {
					this.plugin.settings.Appid = value;
					await this.plugin.saveSettings();
				}));
	}
}
