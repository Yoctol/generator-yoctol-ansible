# Deployment with ansible

Check [Ansible Doc](http://docs.ansible.com/ansible/index.html) for more details.

## Prerequisites

- `Python 2.6 or 2.7` available at local machine (where you run playbooks).
- `Ansible v2.0.2.0` installed at local machine. Install with `pip install ansible==2.0.2.0`.
- `Python2.5 or later` available at remote host (where you wish to run apps).
- A user can login into host using ssh, sudo privilege and home directory are required.
- Run `ansible-galaxy install -r ansible/requirements.yml` to install roles.
