import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { useChat } from 'ai/react'

import { Chat } from "@/components";
import { codeToEngLang, natLangToCode } from "@/utils/lang";

const moduleList = ["directions", "restaurant", "clothing", "weather", "time", "sports", "hobbies", "hackathons"];

type Props = {
  json: any;
};

export default function Page({ json }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const langCode = (searchParams && searchParams.get('lang')) || "en-US";
  const lang = codeToEngLang.get(langCode) || "English";

  const moduleName = router.query.module as string;

  // console.log("MOD", moduleName);

  const getBody = () => {
    return {
      moduleName: moduleName,
      langCode: langCode
    };
  };
  // console.log("MODULE NAME", moduleName);

  const { messages, input, handleInputChange, setInput, handleSubmit, isLoading, append } = useChat({
    api: '/api/openai/generate',
    body: getBody(),
  });


  if (!moduleList.includes(moduleName)) {
    return <div>Sorry this module does not exist.</div>;
  }

  const module = json;
  // console.log("MODULE", module);

  return (
    <Chat 
      messages={messages} 
      input={input} 
      setInput={setInput}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      moduleTitle={module?.module}
      moduleScenario={module?.scenario}
      moduleObjectives={module?.objectives}
      aiResponseLoading={isLoading}
      lang={lang}
      langCode={langCode}
    />
  );
}

export async function getServerSideProps(context: any) {
  const { module } = context.query;

  // console.log("Getting props", module)

  const { readFileSync } = require("fs");
  var path = require("path");
  const fileDirectory = path.join(process.cwd(),"public","data",`${module}.json`);
  const data = JSON.parse(readFileSync(
    fileDirectory,
    'utf8'
  ));

  // Pass data to the page via props
  return { props: { json: data } }
}
 