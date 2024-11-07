import {SVGProps} from "react";

function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6"/>
        </svg>
    )
}


function ClockIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
        </svg>
    )
}


function SettingsIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path
                d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    )
}

function SuccessCircle(props: SVGProps<SVGSVGElement>) {
    return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
        <g fill="none" stroke={props.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
            <path strokeDasharray={60} strokeDashoffset={60}
                  d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z">
                <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="60;0"></animate>
            </path>
            <path strokeDasharray={14} strokeDashoffset={14} d="M8 12L11 15L16 10">
                <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.2s"
                         values="14;0"></animate>
            </path>
        </g>
    </svg>);
}

function XIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
        </svg>
    )
}

function SpinnerIcon(props: SVGProps<SVGSVGElement>) {
    return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" {...props}>
        <path fill={props.color}
              d="M10 3a7 7 0 0 0-7 7a.5.5 0 0 1-1 0a8 8 0 1 1 8 8a.5.5 0 0 1 0-1a7 7 0 1 0 0-14"></path>
    </svg>);
}

function ConfirmCircle(props: SVGProps<SVGSVGElement>) {
    return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
        <g fill="none" stroke={props.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
            <path strokeDasharray={64} strokeDashoffset={64}
                  d="M3 12c0 -4.97 4.03 -9 9 -9c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9Z">
                <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="64;0"></animate>
            </path>
            <path strokeDasharray={14} strokeDashoffset={14} d="M8 12l3 3l5 -5">
                <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.2s"
                         values="14;0"></animate>
            </path>
        </g>
    </svg>);
}

function ErrorCircle(props: SVGProps<SVGSVGElement>) {
    return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
        <mask id="lineMdCloseCircleFilled0">
            <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                <path fill="#fff" fillOpacity={0} strokeDasharray={64} strokeDashoffset={64}
                      d="M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9Z">
                    <animate fill="freeze" attributeName="fill-opacity" begin="0.6s" dur="0.5s" values="0;1"></animate>
                    <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="64;0"></animate>
                </path>
                <path stroke="#000" strokeDasharray={8} strokeDashoffset={8}
                      d="M12 12l4 4M12 12l-4 -4M12 12l-4 4M12 12l4 -4">
                    <animate fill="freeze" attributeName="stroke-dashoffset" begin="1.1s" dur="0.2s"
                             values="8;0"></animate>
                </path>
            </g>
        </mask>
        <rect width={24} height={24} fill={props.color} mask="url(#lineMdCloseCircleFilled0)"></rect>
    </svg>);
}


function AlertLoop(props: SVGProps<SVGSVGElement>) {
    return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
        <g fill="none" stroke={props.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
            <path strokeDasharray={64} strokeDashoffset={64} d="M12 3l9 17h-18l9 -17Z">
                <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="64;0"></animate>
            </path>
            <path strokeDasharray={6} strokeDashoffset={6} d="M12 10v4">
                <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.2s" values="6;0"></animate>
                <animate attributeName="stroke-width" begin="1.8s" dur="3s" keyTimes="0;0.1;0.2;0.3;1"
                         repeatCount="indefinite" values="2;3;3;2;2"></animate>
            </path>
            <path strokeDasharray={2} strokeDashoffset={2} d="M12 17v0.01">
                <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.8s" dur="0.2s" values="2;0"></animate>
                <animate attributeName="stroke-width" begin="2.1s" dur="3s" keyTimes="0;0.1;0.2;0.3;1"
                         repeatCount="indefinite" values="2;3;3;2;2"></animate>
            </path>
        </g>
    </svg>);
}

function InfoAlert(props: SVGProps<SVGSVGElement>) {
    return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
        <g fill="none" stroke={props.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.55}>
            <path strokeDasharray={72} strokeDashoffset={72}
                  d="M3 19.5v-15.5c0 -0.55 0.45 -1 1 -1h16c0.55 0 1 0.45 1 1v12c0 0.55 -0.45 1 -1 1h-14.5Z">
                <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="72;0"></animate>
            </path>
            <path strokeDasharray={4} strokeDashoffset={4} d="M12 7v2">
                <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.2s" values="4;0"></animate>
            </path>
            <path strokeDasharray={2} strokeDashoffset={2} d="M12 13v0.01">
                <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.9s" dur="0.2s" values="2;0"></animate>
            </path>
        </g>
    </svg>);
}

export {
    ChevronRightIcon,
    ClockIcon,
    SettingsIcon,
    XIcon,
    SpinnerIcon,
    SuccessCircle,
    ConfirmCircle,
    ErrorCircle,
    AlertLoop,
    InfoAlert
}