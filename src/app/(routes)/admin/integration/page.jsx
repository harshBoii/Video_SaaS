
// import IntegrationModule from "@/app/components/general/Integration"
// export default function IntegrationPage(){
//     return <IntegrationModule/>
// }


import SocialConnector from "@/app/components/general/VideoIntegration"
export default function IntegrationPage(){
    return <SocialConnector 
            apiKey="your_late_api_key"
            profileId="your_profile_id"
            redirectUrl="https://yourapp.com/callback"
            />

}
