/**
 * Get first part of an email address and divide it by the plus sign, in order to find out the mailbox name and the extra label part.
 * @param {*} email An email address
 * @returns {Object}
 */
export function emailAddressToMailboxName(email) {
    // to-do: validate whether the email address is using whitelisted domain
    const mailbox = {
        name: email.split('@')[0],
        label: null,
        toString: function() {
            if (this.label) {
                return `${this.label}+${this.name}`
            } else {
                return this.name
            }
        }
    }

    if (mailbox.name.includes('+')) {
        let nameSplit = mailbox.name.split('+');
        mailbox.name = nameSplit[1];
        mailbox.label = nameSplit[0];
    }

    return mailbox
}

/**
 * Format an array of address objects to a pretty string
 * @param {*} addr Array of address objects 
 * @returns {String}
 */
export function formatAddress(addr) {
    let out = '';
    /*
    Address array looks like this:
        [
            {
                name: 'Sam',
                address: 'sam@sam.com'
            },
            {
                name: 'Matt',
                address: 'matt@matt.com'
            }
        ]

    This function will turn it into:
        Sam <sam@sam.com>; Matt <matt@matt.com>;
    */
    addr.forEach(contact => {
        out += `${(contact.name ? contact.name + ' ' : '')}<${contact.address}>; `
    })
    return out.trim()
}

export function chunkString(string, size, multiline = true) {
    let matchAllToken = (multiline == true) ? '[^]' : '.';
    let re = new RegExp(matchAllToken + '{1,' + size + '}', 'g');
    return string.match(re);
}