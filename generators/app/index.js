const path = require('path');

const _glob = require('glob');
const glob = require('thenify')(_glob);
const Generator = require('yeoman-generator');

const getBasename = folder => path.basename(folder);
const isNotNodeModules = dir => dir !== 'node_modules';
const validateName = name => !!name.trim().length;

module.exports = class extends Generator {
  prompting() {
    return glob(`${this.destinationRoot()}/*/`)
    .then(folders =>
      this.prompt([{
        type: 'input',
        name: 'projectName',
        message: 'Enter the project name:',
        default: path.basename(this.destinationRoot()),
        validate: validateName,
      }, {
        type: 'input',
        name: 'ansibleDirName',
        message: 'Enter the directory name to place ansible scripts:',
        default: 'ansible',
        validate: validateName,
      }, {
        type: 'confirm',
        name: 'useSubprojects',
        message: 'Is this project containing sub-projects?',
        default: false,
      }, {
        when: answers => answers.useSubprojects,
        type: 'checkbox',
        name: 'subProjects',
        message: 'Select sub-projects to be deployed.',
        choices: folders.map(getBasename).filter(isNotNodeModules),
        validate: selected => !!selected.length,
      }, {
        when: answers => answers.useSubprojects,
        type: 'checkbox',
        name: 'buildOnlySubProjects',
        message: 'Any sub-project should be builded only? (Not behave as server, like front-end)',
        choices: answers => answers.subProjects,
        default: answers => (answers.subProjects.includes('client') ? ['client'] : []),
      }]).then(answers => {
        this.projectName = answers.projectName;
        this.ansibleDirName = answers.ansibleDirName;

        this.useSubprojects = answers.useSubprojects;
        const subProjects = answers.subProjects || [];

        this.buildOnlySubProjects = answers.buildOnlySubProjects;
        this.serviceSubProjects = subProjects.filter(p => !this.buildOnlySubProjects.includes(p));
      })
    );
  }

  writing() {
    this.fs.copy(
      this.templatePath('ansible/**/*'),
      this.destinationPath(this.ansibleDirName)
    );
    ['build', 'distribute', 'run'].forEach(step => {
      this.fs.copyTpl(
        this.templatePath(`${step}.yml.ejs`),
        this.destinationPath(this.ansibleDirName, `playbooks/${step}.yml`),
        this
      );
    });
    this.fs.copyTpl(
      this.templatePath('vars.yml.ejs'),
      this.destinationPath(this.ansibleDirName, 'group_vars/all.yml'),
      this
    );
    if (this.useSubprojects) {
      this.serviceSubProjects.forEach(this._copyFiles.bind(this));
    } else {
      this._copyFiles(null);
    }
    this.fs.copy(
      this.templatePath('gitignore'),
      this.destinationPath(this.ansibleDirName, '.gitignore')
    );
  }

  _copyFiles(subProject) {
    const dockerfileName = subProject ? `${subProject}-Dockerfile` : 'Dockerfile';
    const initFileName = subProject ? `init-${subProject}.sh` : 'init.sh';
    this.fs.copyTpl(
      this.templatePath('Dockerfile.ejs'),
      this.destinationPath(this.ansibleDirName, `templates/${dockerfileName}`),
      { subProject }
    );
    this.fs.copy(
      this.templatePath('init.sh'),
      this.destinationPath(this.ansibleDirName, `files/${initFileName}`)
    );
  }
};
