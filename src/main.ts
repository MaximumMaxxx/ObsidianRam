import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import { } from '@wolfram-alpha/wolfram-alpha-api';


// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	Appid: string;
	AutoInsertGraphs: boolean
	imagePath: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	Appid: '',
	AutoInsertGraphs: false,
	imagePath: "images/",
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	imagePath: string;



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
					// remove any sets of $ to avoid errors

					let newtext = text.replace(/\$/g, '');



					// Do something with the text


					waApi.getFull({
						input: newtext,
						includepodid: "Result",
						format: "plaintext"
					}).then((queryresult: any) => {
						console.log(queryresult);
						const pods = queryresult.pods;
						if (queryresult.numpods === 0) {
							new Notice('No results of the rquired type from Wolfram');
							return
						}
						let concatinatedText = ""
						pods[0].subpods.forEach((subpod: any) => {
							concatinatedText = concatinatedText.concat(subpod.plaintext);
							console.log(subpod.plaintext);
						});

						console.log(concatinatedText);
						new Notice(`${concatinatedText} (Copied)`);
						navigator.clipboard.writeText(concatinatedText);
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
					text = text.replace(/\$/g, '');

					waApi.getFull({
						input: text,
						includepodid: ["Plot", "CountourPlot", "3DPlot"],
						format: "image"
					}).then((queryresult: any) => {
						console.log(queryresult);
						if (queryresult.numpods === 0) {
							new Notice('No plot found.');
							return;
						}
						const pods = queryresult.pods;

						let graphLink = pods[0].subpods[0].img.src






						if (this.settings.AutoInsertGraphs) {
							let currentText = editor.getSelection();
							editor.replaceSelection(`${currentText}\n<img src = "${graphLink}">`);
						} else {
							navigator.clipboard.writeText(`<img src="${graphLink}">`).then(() => {
								new Notice(`Image html has been copied to your clipboard`, 5000);
							});
						}

					})


				} else {
					new Notice('No text selected.', 2000);
				}
			}
		});


		this.addCommand({
			id: 'step-by-step',

			name: 'step by step solution',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let text = editor.getSelection();

				if (this.settings.Appid === '') {
					new Notice('You need to set an Appid in the settings.');
					return false;
				}
				let waApi = WolframAlphaAPI(this.settings.Appid);

				if (text) {
					text = text.replace(/\$/g, '');

					waApi.getFull({
						input: text,
						includepodid: "Result",
						format: "plaintext",
						podstate: "Result__Step-by-step solution",
						output: "JSON"
					}).then((queryresult: any) => {
						let json: any = JSON.parse(queryresult).queryresult;

						console.log(json);
						if (json.numpods === 0) {
							new Notice('No step by step solution found.');
							return;
						}


						let subpods = json.pods[0].subpods;
						subpods.forEach((subpod: any) => {
							if (subpod.title === "Possible intermediate steps") {
								editor.replaceSelection(`${editor.getSelection()}\n\`\`\`\n${subpod.plaintext}\n\`\`\`\n`);
							}
						})

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

		new Setting(containerEl)
			.setName('Auto Insert Graphs')
			.setDesc('Automatically insert graphs on the next line')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.AutoInsertGraphs)
				.onChange(async (value) => {
					this.plugin.settings.AutoInsertGraphs = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName("Image path")
			.setDesc("The path to the image folder")
			.addText(text => text
				.setPlaceholder("Enter the path")
				.setValue(this.plugin.settings.imagePath)
				.onChange(async (value) => {
					this.plugin.settings.imagePath = value;
					await this.plugin.saveSettings();
				}));
	}

}
