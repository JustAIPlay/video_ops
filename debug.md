文本模型 API

| :- |

本文介绍平台中语言大模型API的输入输出参数，供您使用接口向大模型发起文字对话请求时查阅字段含义。

baseUrl : https://maas-api.lanyun.net/v1/chat/completions
鉴权方式

本接口支持 API Key 鉴权方式

请求参数

请求体

参数名称	类型	是否必填	默认值	描述	示例值
model	String	是	-	本次请求使用模型的API调用模型名，即Model ID	/maas/deepseek-ai/DeepSeek-R1
stream	Boolean	否	FALSE	响应内容是否流式返回false：模型生成完所有内容后一次性返回结果true：按 SSE 协议逐块返回模型生成内容，并以一条 data: [DONE] 消息结束	FALSE
stream_options	Object of StreamOptionsParam	否	-	流式响应的选项。仅当 stream: true 时可以设置 stream_options 参数。	-
max_tokens	Integer	否	4096	注意模型回复最大长度（单位 token），取值范围各个模型不同，详细见支持的大模型。输入 token 和输出 token 的总长度还受模型的上下文长度限制。	4096
stop	String or Array	否	-	模型遇到 stop 字段所指定的字符串时将停止继续生成，这个词语本身不会输出。最多支持 4 个字符串。	["你好", "天气"]
frequency_penalty	Float	否	0	频率惩罚系数。如果值为正，会根据新 token 在文本中的出现频率对其进行惩罚，从而降低模型逐字重复的可能性。取值范围为 [-2.0, 2.0]。	1
presence_penalty	Float	否	0	存在惩罚系数。如果值为正，会根据新 token 到目前为止是否出现在文本中对其进行惩罚，从而增加模型谈论新主题的可能性。取值范围为 [-2.0, 2.0]。	1
logprobs	Boolean	否	FALSE	是否返回输出 tokens 的对数概率。false：不返回对数概率信息true：返回消息内容中每个输出 token 的对数概率	FALSE
top_logprobs	Integer	否	0	指定每个输出 token 位置最有可能返回的 token 数量，每个 token 都有关联的对数概率。仅当 logprobs: true 时可以设置 top_logprobs 参数，取值范围为 [0, 20]。	2
tools	Array of ToolParam	否	-	模型可以调用的工具列表。目前，仅函数作为工具被支持。用这个来提供模型可能为其生成 JSON 输入的函数列表。	-
数据结构

MessageParam

参数名称	类型	是否必填	默认值	描述	示例值
role	String	是	-	发出该消息的对话参与者角色，可选值包括：system：System Message 系统消息user：User Message 用户消息assistant：Assistant Message 对话助手消息tool：Tool Message 工具调用消息	user
content	String	否	-	消息内容，文本生成模型仅支持 String 类型。当 role 为 system、user、tool时，参数必填。当 role 为 assistant 时，content 与 tool_calls 参数二者至少填写其一。	世界第一高山是什么？
tool_calls	Array of MessageToolCallParam	否	-	模型生成的工具调用。当 role 为 assistant 时，content 与 tool_calls 参数二者至少填其一	-
tool_call_id	String	否	-	此消息所回应的工具调用 ID，当 role 为 tool 时必填	call_5y***********
MessageToolCallParam

参数名称	类型	是否必填	默认值	描述	示例值
id	String	是	-	当前工具调用 ID	call_5y**********
type	String	是	-	工具类型，当前仅支持function	function
function	FunctionParam	是	-	模型需要调用的函数	-
FunctionParam

参数名称	类型	是否必填	默认值	描述	示例值
name	String	是	-	模型需要调用的函数名称	get_current_weather
arguments

String	是	-	模型生成的用于调用函数的参数，JSON 格式。请注意，模型并不总是生成有效的 JSON，并且可能会虚构出一些您的函数参数规范中未定义的参数。在调用函数之前，请在您的代码中验证这些参数是否有效。	--
ToolParam

参数名称	类型	是否必填	默认值	描述	示例值
type	String	是	-	工具类型，当前仅支持 function	function
function	FunctionDefinition	是	-	模型可以调用的工具列表。	-
FunctionDefinition

参数名称	类型	是否必填	默认值	描述	示例值
name	String	是	-	函数的名称	get_current_weather
description	String	否	-	对函数用途的描述，供模型判断何时以及如何调用该工具函数	获取指定城市的天气信息
StreamOptionsParam

参数名称	类型	是否必填	默认值	描述	示例值
include_usage	Boolean	否	FALSE	是否包含本次请求的 token 用量统计信息false：不返回 token 用量信息true：在 data: [DONE] 消息之前返回一个额外的块，此块上的 usage 字段代表整个请求的 token 用量，choices 字段为空数组。所有其他块也将包含 usage 字段，但值为 null。	FALSE
响应参数

非流式调用

参数名称	类型	描述	示例值
id	String	本次请求的唯一标识	02171********************
model	String	本次请求实际使用的API调用模型	/maas/deepseek-ai/DeepSeek-R1
created	Integer	本次请求创建时间的 Unix 时间戳（秒）	1718049470
object	String	固定为 chat.completion	chat.completion
choices	Array of Choice	本次请求的模型输出内容	-
usage	Usage	本次请求的 tokens 用量	-
流式调用

参数名称	类型	描述	示例值
id	String	本次请求的唯一标识	2171804947
model	String	本次请求实际使用的API调用模型	/maas/deepseek-ai/DeepSeek-R1
created	Integer	本次请求创建时间的 Unix 时间戳（秒）	1718049470
object	String	固定为 chat.completion.chunk	chat.completion.chunk
choices	StreamChoice	本次请求的模型输出内容	-
usage	Usage	本次请求的 tokens 用量	-
数据结构

Choice

参数名称	类型	描述	示例值
index	Integer	当前元素在 choices 列表的索引	0
finish_reason	String	模型停止生成 token 的原因。取值范围：stop：模型输出自然结束，或因命中请求参数 stop 中指定的字段而被截断length：模型输出因达到请求参数 max_token 指定的最大 token 数量而被截断content_filter：模型输出被内容审核拦截tool_calls：模型调用了工具	stop
message	Message	模型输出的内容	-
logprobs	ChoiceLogprobs	当前内容的对数概率信息	-
Message

参数名称	类型	描述	示例值
role	String	固定为 assistant	assistant
content	String	模型生成的消息内容，content 与 tool_calls 字段二者至少有一个为非空	"你好"
reasoning_content	String	模型处理问题的思维链内容。	-
tool_calls	Array of MessageToolCall	模型生成的工具调用，content 与 tool_calls 字段二者至少有一个为非空	-
MessageToolCall			
参数名称	类型	描述	示例值
id	String	当前工具调用 ID	call_5y********
type	String	工具类型，当前仅支持function	function
function	function	模型需要调用的函数	-
Function

参数名称	类型	描述	示例值
name	String	模型需要调用的函数名称	get_current_weather
arguments	String	模型生成的用于调用函数的参数，JSON 格式。请注意，模型并不总是生成有效的 JSON，并且可能会虚构出一些您的函数参数规范中未定义的参数。在调用函数之前，请在您的代码中验证这些参数是否有效。	--
ChoiceLogprobs

参数名称	类型	描述	示例值
content	Array of TokenLogprob	message列表中每个 content 元素中的 token 对数概率信息	-
TokenLogprob

参数名称	类型	描述	示例值
token	String	当前 token。	The
bytes	Array of Integer	当前 token 的 UTF-8 值，格式为整数列表。当一个字符由多个 token 组成（表情符号或特殊字符等）时可以用于字符的编码和解码。如果 token 没有 UTF-8 值则为空。	[84, 104, 101]
logprob	Float	当前 token 的对数概率。	-0.01550293
top_logprobs	Array of TopLogprob	在当前 token 位置最有可能的标记及其对数概率的列表。在一些情况下，返回的数量可能比请求参数 top_logprobs 指定的数量要少。	-
TopLogprob

参数名称	类型	描述	示例值
token	String	当前 token。	The
bytes	Array of Integer	当前 token 的 UTF-8 值，格式为整数列表。当一个字符由多个 token 组成（表情符号或特殊字符等）时可以用于字符的编码和解码。如果 token 没有 UTF-8 值则为空。	[84, 104, 101]
logprob	Float	当前 token 的对数概率。	-0.01550293
Usage

参数名称	类型	描述	示例值
prompt_tokens	Integer	输入的 prompt token 数量	130
completion_tokens	Integer	模型生成的 token 数量	100
total_tokens	Integer	本次请求消耗的总 token 数量（输入 + 输出）	230
prompt_tokens_details	Object	本接口暂不支持上下文缓存，此时返回应为"cached_tokens": 0。prompt_tokens中命中上下文缓存的tokens数。	-
completion_tokens_details	Object	本次请求花费的 token 的细节。其中reasoning_tokens是指输出思维链内容花费的 token 。	-
StreamChoice

参数名称	类型	描述	示例值
index	Integer	当前元素在 choices 列表的索引	0
finish_reason	String	模型停止生成 token 的原因。可能的值包括：stop：模型输出自然结束，或因命中请求参数 stop 中指定的字段而被截断length：模型输出因达到请求参数 max_token 指定的最大 token 数量而被截断content_filter：模型输出被内容审核拦截tool_calls：模型调用了工具	stop
delta	ChoiceDelta	模型输出的内容。	-
logprobs	ChoiceLogprobs	当前内容的对数概率信息。	-
ChoiceDelta

参数名称	类型	描述	示例值
index	Integer	当前元素在 choices 列表的索引	0
finish_reason	String	模型停止生成 token 的原因。可能的值包括：stop：模型输出自然结束，或因命中请求参数 stop 中指定的字段而被截断length：模型输出因达到请求参数 max_token 指定的最大 token 数量而被截断content_filter：模型输出被内容审核拦截tool_calls：模型调用了工具	stop
delta	ChoiceDelta	模型输出的内容。	-
logprobs	ChoiceLogprobs	当前内容的对数概率信息。	-
ChoiceDeltaToolCall

参数名称	类型	描述	示例值
index	Interger	当前元素在 tool_calls 列表的索引	0
id	String	当前工具调用 ID	call_5y***********
type	String	工具类型，当前仅支持function	function
function	Function	模型需要调用的函数	-
请求示例

curl https://maas-api.lanyun.net/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ea764f0f-3b60-45b3--********" \
  -d '{
    "model": "/maas/deepseek-ai/DeepSeek-R1",
    "messages": [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "Hello!"
        }
    ]
  }'
CopyErrorOK!
响应示例

{
  "id": "021718067849899d92fcbe0865fdffdde********************",
  "object": "chat.completion",
  "created": 1720582714,
  "model": "/maas/deepseek-ai/DeepSeek-R1",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello, can i help you with something?"
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 22,
    "completion_tokens": 9,
    "total_tokens": 31,
    "prompt_tokens_details": {
      "cached_tokens": 0
    }
  }
}