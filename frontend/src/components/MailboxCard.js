import Canvg from 'canvg';
import { useState, useEffect } from 'react';
import welcomeHeaderFile from '../welcomeHeader.svg';

function cleanMailboxName(name) {
    return name.trim().split("#")[0].toLowerCase().replace(/ /g, '.').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/[^0-9a-zA-Z.]/g, '');
}

function MailboxCard(props) {
    const [ welcomeHeaderTemplate, setWelcomeHeaderTemplate ] = useState('');
    const [ mailboxName, setMailboxName ] = useState('');
    const [ forceShow, setForceShow ] = useState(false);
    const [ availability, setAvailability ] = useState("");
    useEffect(() => {
        console.log('Fetching welcomeHeader from ' + welcomeHeaderFile + '...');
        fetch(welcomeHeaderFile)
        .then(res => res.text())
        .then(data => {
            setWelcomeHeaderTemplate(data);
        })
    }, []);

    useEffect(() => {
        setForceShow(false);
        if (Object.keys(props.memberData).length > 0) {
            renderCanvas(props.memberData.username);     
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.memberData])

    useEffect(() => {
        if (mailboxName.length === 0) return
        updateAvailability(mailboxName)
    }, [mailboxName])

    const renderCanvas = async (username) => {
        console.log('Rendering canvas...')
        const name = cleanMailboxName(username);
        setMailboxName(name);

        const canvas = document.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const v = await Canvg.fromString(ctx, welcomeHeaderTemplate.replace('[name]', name).replace(/\[size\]/gi, (name.length > 13 ? '0.6em' : '0.7em')));

        v.start();
    }

    const updateAvailability = async (mailbox) => {
        const {available} = await fetch(`/api/checkAvailability?mailbox=${encodeURIComponent(mailbox)}`).then(res => res.json())

        if (available == null) return setAvailability("")

        console.log(available, available ? "statusAvailable" : "statusUnavailable")
        return setAvailability(available)
    }
    
    function onChange(name) {
        renderCanvas(name);
    }

    const updateMemberData = () => {
        console.log(props.members)
        const membersCopy = [...props.members];
        const index = membersCopy.findIndex(member => member.id === props.memberData.id)
        membersCopy[index].registered = mailboxName;
        props.setMembers(membersCopy);
    }

    const inputKeyUpEvent = (event) => {
        if(event.key !== "Enter") return; 
        document.querySelector("#registerBtn").click(); 
        event.preventDefault(); 
    };

    const register = () => {
        if (window.confirm(`Myönnät käyttäjälle ${props.memberData.username} sähköpostilaatikon ${mailboxName}@testausserveri.fi ja lähetät kyseiselle käyttäjälle Discord-viestin tästä jäsenedusta. Vahvista?`)) {
            document.querySelector('canvas').toBlob(function(blob) {
                const formData = new FormData();
                formData.append('image', blob, mailboxName + '.png');
                formData.append('id', props.memberData.id);
                formData.append('mailbox', mailboxName);
                fetch('/api/register', {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json() )
                .then(data => {
                    console.log(data)
                    if (data.status === "ok") {
                        setForceShow(false);
                        updateMemberData();
                    } else {

                        alert('Tapahtui virhe: ' + data.message);
                    }
                })
            });
    
        } else {
            alert('Peruutettu');
        }
    }
    return (
        <div>
            {(props.memberData.registered ? 
            <p>
                <b>
                    Jäsenellä on jo sähköpostilaatikko.&nbsp;
                    <a href="#forceShow" onClick={(event) => {event.preventDefault(); setForceShow(true); setTimeout(()=>{updateAvailability(mailboxName); document.querySelector('#memberEmailInput').focus();}, 5)}}>Luo alias</a>
                </b>
            </p> 
            : 
            <p>
                Jäsenellä ei ole vielä sähköpostilaatikkoa.
            </p>
            )}
            <div style={(!!!props.memberData.registered || forceShow) ? {} : {display: 'none'}}>
                <label htmlFor="memberEmailInput">Sähköpostilaatikon nimi</label><br></br>
                <div className={!availability ? "statusAvailable" : "statusUnavailable"} style={{ "--taken-by": "'Varattu " + (availability ? props.members.find(member => member.id === availability)?.username || "": "") + "'" }}>
                    <input id="memberEmailInput" value={mailboxName} autoFocus={true} autoComplete="off" spellCheck="false" type="text" onKeyUp={inputKeyUpEvent} onChange={(event) => onChange(event.target.value)} />
                </div>
                
                <canvas></canvas><br /><br />
                <input type="button" id="registerBtn" value="Rekisteröi ja lähetä viesti" onClick={() => register()}/>
            </div>
        </div>
    )
}

export default MailboxCard;