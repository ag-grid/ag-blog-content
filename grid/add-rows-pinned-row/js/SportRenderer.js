class SportRenderer {
  init(params) {
    this.sportIconMap = {
      Swimming: 'swimming',
      Gymnastics: 'running',
      Cycling: 'biking',
      'Ski Jumping': 'skiing',
    };

    this.value = params.value;

    this.eGui = document.createElement('div');

    this.eGui.innerHTML = `
    <i class='fa-solid fa-person-${this.sportIconMap[params.value]}'></i>
    <span style="margin-left: 5px;">${this.getValueToDisplay(params)}</span>
    `;
  }

  getGui() {
    return this.eGui;
  }

  getValueToDisplay(params) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  refresh = () => false;
}
