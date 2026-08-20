import { Client, AnyVariables, CombinedError, Operation, OperationContext, OperationResult, DocumentInput, RequestPolicy, GraphQLRequestParams } from '@urql/core';
export * from '@urql/core';
import * as React from 'react';
import { ReactElement } from 'react';

/** `urql`'s React Context.
 *
 * @remarks
 * The React Context that `urql`’s {@link Client} will be provided with.
 * You may use the reexported {@link Provider} to provide a `Client` as well.
 */
declare const Context: React.Context<Client | object>;
/** Provider for `urql`'s {@link Client} to GraphQL hooks.
 *
 * @remarks
 * `Provider` accepts a {@link Client} and provides it to all GraphQL hooks,
 * and {@link useClient}.
 *
 * You should make sure to create a {@link Client} and provide it with the
 * `Provider` to parts of your component tree that use GraphQL hooks.
 *
 * @example
 * ```tsx
 * import { Provider } from 'urql';
 * // All of `@urql/core` is also re-exported by `urql`:
 * import { Client, cacheExchange, fetchExchange } from '@urql/core';
 *
 * const client = new Client({
 *   url: 'https://API',
 *   exchanges: [cacheExchange, fetchExchange],
 * });
 *
 * const App = () => (
 *   <Provider value={client}>
 *     <Component />
 *   </Provider>
 * );
 * ```
 */
declare const Provider: React.Provider<Client | object>;
/** React Consumer component, providing the {@link Client} provided on a parent component.
 * @remarks
 * This is an alias for {@link Context.Consumer}.
 */
declare const Consumer: React.Consumer<Client | object>;
/** Hook returning a {@link Client} from {@link Context}.
 *
 * @remarks
 * `useClient` is a convenience hook, which accesses `urql`'s {@link Context}
 * and returns the {@link Client} defined on it.
 *
 * This will be the {@link Client} you passed to a {@link Provider}
 * you wrapped your elements containing this hook with.
 *
 * @throws
 * In development, if the component you call `useClient()` in is
 * not wrapped in a {@link Provider}, an error is thrown.
 */
declare const useClient: () => Client;

/** State of the last mutation executed by your {@link useMutation} hook.
 *
 * @remarks
 * `UseMutationState` is returned (in a tuple) by {@link useMutation} and
 * gives you the {@link OperationResult} of the last mutation executed
 * with {@link UseMutationExecute}.
 *
 * Even if the mutation document passed to {@link useMutation} changes,
 * the state isn’t reset, so you can keep displaying the previous result.
 */
interface UseMutationState<Data = any, Variables extends AnyVariables = AnyVariables> {
    /** Indicates whether `useMutation` is currently executing a mutation. */
    fetching: boolean;
    /** Indicates that the mutation result is not fresh.
     *
     * @remarks
     * The `stale` flag is set to `true` when a new result for the mutation
     * is expected.
     * This is mostly unused for mutations and will rarely affect you, and
     * is more relevant for queries.
     *
     * @see {@link OperationResult.stale} for the source of this value.
     */
    stale: boolean;
    /** The {@link OperationResult.data} for the executed mutation. */
    data?: Data;
    /** The {@link OperationResult.error} for the executed mutation. */
    error?: CombinedError;
    /** The {@link OperationResult.extensions} for the executed mutation. */
    extensions?: Record<string, any>;
    /** The {@link OperationResult.hasNext} for the executed query. */
    hasNext: boolean;
    /** The {@link Operation} that the current state is for.
     *
     * @remarks
     * This is the mutation {@link Operation} that has last been executed.
     * When {@link UseQueryState.fetching} is `true`, this is the
     * last `Operation` that the current state was for.
     */
    operation?: Operation<Data, Variables>;
}
/** Triggers {@link useMutation} to execute its GraphQL mutation operation.
 *
 * @param variables - variables using which the mutation will be executed.
 * @param context - optionally, context options that will be merged with the hook's
 * {@link UseQueryArgs.context} options and the `Client`’s options.
 * @returns the {@link OperationResult} of the mutation.
 *
 * @remarks
 * When called, {@link useMutation} will start the GraphQL mutation
 * it currently holds and use the `variables` passed to it.
 *
 * Once the mutation response comes back from the API, its
 * returned promise will resolve to the mutation’s {@link OperationResult}
 * and the {@link UseMutationState} will be updated with the result.
 *
 * @example
 * ```ts
 * const [result, executeMutation] = useMutation(UpdateTodo);
 * const start = async ({ id, title }) => {
 *   const result = await executeMutation({ id, title });
 * };
 */
type UseMutationExecute<Data = any, Variables extends AnyVariables = AnyVariables> = (variables: Variables, context?: Partial<OperationContext>) => Promise<OperationResult<Data, Variables>>;
/** Result tuple returned by the {@link useMutation} hook.
 *
 * @remarks
 * Similarly to a `useState` hook’s return value,
 * the first element is the {@link useMutation}’s state, updated
 * as mutations are executed with the second value, which is
 * used to start mutations and is a {@link UseMutationExecute}
 * function.
 */
type UseMutationResponse<Data = any, Variables extends AnyVariables = AnyVariables> = [UseMutationState<Data, Variables>, UseMutationExecute<Data, Variables>];
/** Hook to create a GraphQL mutation, run by passing variables to the returned execute function.
 *
 * @param query - a GraphQL mutation document which `useMutation` will execute.
 * @returns a {@link UseMutationResponse} tuple of a {@link UseMutationState} result,
 * and an execute function to start the mutation.
 *
 * @remarks
 * `useMutation` allows GraphQL mutations to be defined and keeps its state
 * after the mutation is started with the returned execute function.
 *
 * Given a GraphQL mutation document it returns state to keep track of the
 * mutation state and a {@link UseMutationExecute} function, which accepts
 * variables for the mutation to be executed.
 * Once called, the mutation executes and the state will be updated with
 * the mutation’s result.
 *
 * @see {@link https://urql.dev/goto/urql/docs/basics/react-preact/#mutations} for `useMutation` docs.
 *
 * @example
 * ```ts
 * import { gql, useMutation } from 'urql';
 *
 * const UpdateTodo = gql`
 *   mutation ($id: ID!, $title: String!) {
 *     updateTodo(id: $id, title: $title) {
 *       id, title
 *     }
 *   }
 * `;
 *
 * const UpdateTodo = () => {
 *   const [result, executeMutation] = useMutation(UpdateTodo);
 *   const start = async ({ id, title }) => {
 *     const result = await executeMutation({ id, title });
 *   };
 *   // ...
 * };
 * ```
 */
declare function useMutation<Data = any, Variables extends AnyVariables = AnyVariables>(query: DocumentInput<Data, Variables>): UseMutationResponse<Data, Variables>;

/** Input arguments for the {@link useQuery} hook.
 *
 * @param query - The GraphQL query that `useQuery` executes.
 * @param variables - The variables for the GraphQL query that `useQuery` executes.
 */
type UseQueryArgs<Variables extends AnyVariables = AnyVariables, Data = any> = {
    /** Updates the {@link RequestPolicy} for the executed GraphQL query operation.
     *
     * @remarks
     * `requestPolicy` modifies the {@link RequestPolicy} of the GraphQL query operation
     * that `useQuery` executes, and indicates a caching strategy for cache exchanges.
     *
     * For example, when set to `'cache-and-network'`, {@link useQuery} will
     * receive a cached result with `stale: true` and an API request will be
     * sent in the background.
     *
     * @see {@link OperationContext.requestPolicy} for where this value is set.
     */
    requestPolicy?: RequestPolicy;
    /** Updates the {@link OperationContext} for the executed GraphQL query operation.
     *
     * @remarks
     * `context` may be passed to {@link useQuery}, to update the {@link OperationContext}
     * of a query operation. This may be used to update the `context` that exchanges
     * will receive for a single hook.
     *
     * Hint: This should be wrapped in a `useMemo` hook, to make sure that your
     * component doesn’t infinitely update.
     *
     * @example
     * ```ts
     * const [result, reexecute] = useQuery({
     *   query,
     *   context: useMemo(() => ({
     *     additionalTypenames: ['Item'],
     *   }), [])
     * });
     * ```
     */
    context?: Partial<OperationContext>;
    /** Prevents {@link useQuery} from automatically executing GraphQL query operations.
     *
     * @remarks
     * `pause` may be set to `true` to stop {@link useQuery} from executing
     * automatically. The hook will stop receiving updates from the {@link Client}
     * and won’t execute the query operation, until either it’s set to `false`
     * or the {@link UseQueryExecute} function is called.
     *
     * @see {@link https://urql.dev/goto/docs/basics/react-preact/#pausing-usequery} for
     * documentation on the `pause` option.
     */
    pause?: boolean;
} & GraphQLRequestParams<Data, Variables>;
/** State of the current query, your {@link useQuery} hook is executing.
 *
 * @remarks
 * `UseQueryState` is returned (in a tuple) by {@link useQuery} and
 * gives you the updating {@link OperationResult} of GraphQL queries.
 *
 * Even when the query and variables passed to {@link useQuery} change,
 * this state preserves the prior state and sets the `fetching` flag to
 * `true`.
 * This allows you to display the previous state, while implementing
 * a separate loading indicator separately.
 */
interface UseQueryState<Data = any, Variables extends AnyVariables = AnyVariables> {
    /** Indicates whether `useQuery` is waiting for a new result.
     *
     * @remarks
     * When `useQuery` is passed a new query and/or variables, it will
     * start executing the new query operation and `fetching` is set to
     * `true` until a result arrives.
     *
     * Hint: This is subtly different than whether the query is actually
     * fetching, and doesn’t indicate whether a query is being re-executed
     * in the background. For this, see {@link UseQueryState.stale}.
     */
    fetching: boolean;
    /** Indicates that the state is not fresh and a new result will follow.
     *
     * @remarks
     * The `stale` flag is set to `true` when a new result for the query
     * is expected and `useQuery` is waiting for it. This may indicate that
     * a new request is being requested in the background.
     *
     * @see {@link OperationResult.stale} for the source of this value.
     */
    stale: boolean;
    /** The {@link OperationResult.data} for the executed query. */
    data?: Data;
    /** The {@link OperationResult.error} for the executed query. */
    error?: CombinedError;
    /** The {@link OperationResult.hasNext} for the executed query. */
    hasNext: boolean;
    /** The {@link OperationResult.extensions} for the executed query. */
    extensions?: Record<string, any>;
    /** The {@link Operation} that the current state is for.
     *
     * @remarks
     * This is the {@link Operation} that is currently being executed.
     * When {@link UseQueryState.fetching} is `true`, this is the
     * last `Operation` that the current state was for.
     */
    operation?: Operation<Data, Variables>;
}
/** Triggers {@link useQuery} to execute a new GraphQL query operation.
 *
 * @param opts - optionally, context options that will be merged with the hook's
 * {@link UseQueryArgs.context} options and the `Client`’s options.
 *
 * @remarks
 * When called, {@link useQuery} will re-execute the GraphQL query operation
 * it currently holds, even if {@link UseQueryArgs.pause} is set to `true`.
 *
 * This is useful for executing a paused query or re-executing a query
 * and get a new network result, by passing a new request policy.
 *
 * ```ts
 * const [result, reexecuteQuery] = useQuery({ query });
 *
 * const refresh = () => {
 *   // Re-execute the query with a network-only policy, skipping the cache
 *   reexecuteQuery({ requestPolicy: 'network-only' });
 * };
 * ```
 */
type UseQueryExecute = (opts?: Partial<OperationContext>) => void;
/** Result tuple returned by the {@link useQuery} hook.
 *
 * @remarks
 * Similarly to a `useState` hook’s return value,
 * the first element is the {@link useQuery}’s result and state,
 * a {@link UseQueryState} object,
 * and the second is used to imperatively re-execute the query
 * via a {@link UseQueryExecute} function.
 */
type UseQueryResponse<Data = any, Variables extends AnyVariables = AnyVariables> = [UseQueryState<Data, Variables>, UseQueryExecute];
/** Hook to run a GraphQL query and get updated GraphQL results.
 *
 * @param args - a {@link UseQueryArgs} object, to pass a `query`, `variables`, and options.
 * @returns a {@link UseQueryResponse} tuple of a {@link UseQueryState} result, and re-execute function.
 *
 * @remarks
 * `useQuery` allows GraphQL queries to be defined and executed.
 * Given {@link UseQueryArgs.query}, it executes the GraphQL query with the
 * context’s {@link Client}.
 *
 * The returned result updates when the `Client` has new results
 * for the query, and changes when your input `args` change.
 *
 * Additionally, if the `suspense` option is enabled on the `Client`,
 * the `useQuery` hook will suspend instead of indicating that it’s
 * waiting for a result via {@link UseQueryState.fetching}.
 *
 * @see {@link https://urql.dev/goto/urql/docs/basics/react-preact/#queries} for `useQuery` docs.
 *
 * @example
 * ```ts
 * import { gql, useQuery } from 'urql';
 *
 * const TodosQuery = gql`
 *   query { todos { id, title } }
 * `;
 *
 * const Todos = () => {
 *   const [result, reexecuteQuery] = useQuery({
 *     query: TodosQuery,
 *     variables: {},
 *   });
 *   // ...
 * };
 * ```
 */
declare function useQuery<Data = any, Variables extends AnyVariables = AnyVariables>(args: UseQueryArgs<Variables, Data>): UseQueryResponse<Data, Variables>;

/** Input arguments for the {@link useSubscription} hook.
 *
 * @param query - The GraphQL subscription document that `useSubscription` executes.
 * @param variables - The variables for the GraphQL subscription that `useSubscription` executes.
 */
type UseSubscriptionArgs<Variables extends AnyVariables = AnyVariables, Data = any> = {
    /** Prevents {@link useSubscription} from automatically starting GraphQL subscriptions.
     *
     * @remarks
     * `pause` may be set to `true` to stop {@link useSubscription} from starting its subscription
     * automatically. The hook will stop receiving updates from the {@link Client}
     * and won’t start the subscription operation, until either it’s set to `false`
     * or the {@link UseSubscriptionExecute} function is called.
     */
    pause?: boolean;
    /** Updates the {@link OperationContext} for the executed GraphQL subscription operation.
     *
     * @remarks
     * `context` may be passed to {@link useSubscription}, to update the {@link OperationContext}
     * of a subscription operation. This may be used to update the `context` that exchanges
     * will receive for a single hook.
     *
     * Hint: This should be wrapped in a `useMemo` hook, to make sure that your
     * component doesn’t infinitely update.
     *
     * @example
     * ```ts
     * const [result, reexecute] = useSubscription({
     *   query,
     *   context: useMemo(() => ({
     *     additionalTypenames: ['Item'],
     *   }), [])
     * });
     * ```
     */
    context?: Partial<OperationContext>;
} & GraphQLRequestParams<Data, Variables>;
/** Combines previous data with an incoming subscription result’s data.
 *
 * @remarks
 * A `SubscriptionHandler` may be passed to {@link useSubscription} to
 * aggregate subscription results into a combined {@link UseSubscriptionState.data}
 * value.
 *
 * This is useful when a subscription event delivers a single item, while
 * you’d like to display a list of events.
 *
 * @example
 * ```ts
 * const NotificationsSubscription = gql`
 *   subscription { newNotification { id, text } }
 * `;
 *
 * const combineNotifications = (notifications = [], data) => {
 *   return [...notifications, data.newNotification];
 * };
 *
 * const [result, executeSubscription] = useSubscription(
 *   { query: NotificationsSubscription },
 *   combineNotifications,
 * );
 * ```
 */
type SubscriptionHandler<T, R> = (prev: R | undefined, data: T) => R;
/** State of the current subscription, your {@link useSubscription} hook is executing.
 *
 * @remarks
 * `UseSubscriptionState` is returned (in a tuple) by {@link useSubscription} and
 * gives you the updating {@link OperationResult} of GraphQL subscriptions.
 *
 * If a {@link SubscriptionHandler} has been passed to `useSubscription` then
 * {@link UseSubscriptionState.data} is instead the updated data as returned
 * by the handler, otherwise it’s the latest result’s data.
 *
 * Hint: Even when the query and variables passed to {@link useSubscription} change,
 * this state preserves the prior state.
 */
interface UseSubscriptionState<Data = any, Variables extends AnyVariables = AnyVariables> {
    /** Indicates whether `useSubscription`’s subscription is active.
     *
     * @remarks
     * When `useSubscription` starts a subscription, the `fetching` flag
     * is set to `true` and will remain `true` until the subscription
     * completes on the API, or the {@link UseSubscriptionArgs.pause}
     * flag is set to `true`.
     */
    fetching: boolean;
    /** Indicates that the subscription result is not fresh.
     *
     * @remarks
     * This is mostly unused for subscriptions and will rarely affect you, and
     * is more relevant for queries.
     *
     * @see {@link OperationResult.stale} for the source of this value.
     */
    stale: boolean;
    /** The {@link OperationResult.data} for the executed subscription, or data returned by a handler.
     *
     * @remarks
     * `data` will be set to the last {@link OperationResult.data} value
     * received for the subscription.
     *
     * It will instead be set to the values that {@link SubscriptionHandler}
     * returned, if a handler has been passed to {@link useSubscription}.
     */
    data?: Data;
    /** The {@link OperationResult.error} for the executed subscription. */
    error?: CombinedError;
    /** The {@link OperationResult.extensions} for the executed mutation. */
    extensions?: Record<string, any>;
    /** The {@link Operation} that the current state is for.
     *
     * @remarks
     * This is the subscription {@link Operation} that is currently active.
     * When {@link UseSubscriptionState.fetching} is `true`, this is the
     * last `Operation` that the current state was for.
     */
    operation?: Operation<Data, Variables>;
}
/** Triggers {@link useSubscription} to reexecute a GraphQL subscription operation.
 *
 * @param opts - optionally, context options that will be merged with the hook's
 * {@link UseSubscriptionArgs.context} options and the `Client`’s options.
 *
 * @remarks
 * When called, {@link useSubscription} will restart the GraphQL subscription
 * operation it currently holds. If {@link UseSubscriptionArgs.pause} is set
 * to `true`, it will start executing the subscription.
 *
 * ```ts
 * const [result, executeSubscription] = useSubscription({
 *   query,
 *   pause: true,
 * });
 *
 * const start = () => {
 *   executeSubscription();
 * };
 * ```
 */
type UseSubscriptionExecute = (opts?: Partial<OperationContext>) => void;
/** Result tuple returned by the {@link useSubscription} hook.
 *
 * @remarks
 * Similarly to a `useState` hook’s return value,
 * the first element is the {@link useSubscription}’s state,
 * a {@link UseSubscriptionState} object,
 * and the second is used to imperatively re-execute or start the subscription
 * via a {@link UseMutationExecute} function.
 */
type UseSubscriptionResponse<Data = any, Variables extends AnyVariables = AnyVariables> = [UseSubscriptionState<Data, Variables>, UseSubscriptionExecute];
/** Hook to run a GraphQL subscription and get updated GraphQL results.
 *
 * @param args - a {@link UseSubscriptionArgs} object, to pass a `query`, `variables`, and options.
 * @param handler - optionally, a {@link SubscriptionHandler} function to combine multiple subscription results.
 * @returns a {@link UseSubscriptionResponse} tuple of a {@link UseSubscriptionState} result, and an execute function.
 *
 * @remarks
 * `useSubscription` allows GraphQL subscriptions to be defined and executed.
 * Given {@link UseSubscriptionArgs.query}, it executes the GraphQL subscription with the
 * context’s {@link Client}.
 *
 * The returned result updates when the `Client` has new results
 * for the subscription, and `data` is updated with the result’s data
 * or with the `data` that a `handler` returns.
 *
 * @example
 * ```ts
 * import { gql, useSubscription } from 'urql';
 *
 * const NotificationsSubscription = gql`
 *   subscription { newNotification { id, text } }
 * `;
 *
 * const combineNotifications = (notifications = [], data) => {
 *   return [...notifications, data.newNotification];
 * };
 *
 * const Notifications = () => {
 *   const [result, executeSubscription] = useSubscription(
 *     { query: NotificationsSubscription },
 *     combineNotifications,
 *   );
 *   // ...
 * };
 * ```
 */
declare function useSubscription<Data = any, Result = Data, Variables extends AnyVariables = AnyVariables>(args: UseSubscriptionArgs<Variables, Data>, handler?: SubscriptionHandler<Data, Result>): UseSubscriptionResponse<Result, Variables>;

/** Props accepted by {@link Mutation}.
 *
 * @remarks
 * `MutationProps` are the props accepted by the {@link Mutation} component.
 *
 * The result, the {@link MutationState} object, will be passed to
 * a {@link MutationProps.children} function, passed as children
 * to the `Mutation` component.
 */
interface MutationProps<Data = any, Variables extends AnyVariables = AnyVariables> {
    query: DocumentInput<Data, Variables>;
    children(arg: MutationState<Data, Variables>): ReactElement<any>;
}
/** Object that {@link MutationProps.children} is called with.
 *
 * @remarks
 * This is an extented {@link UseMutationstate} with an added
 * {@link MutationState.executeMutation} method, which is usually
 * part of a tuple returned by {@link useMutation}.
 */
interface MutationState<Data = any, Variables extends AnyVariables = AnyVariables> extends UseMutationState<Data, Variables> {
    /** Alias to {@link useMutation}’s `executeMutation` function. */
    executeMutation: UseMutationExecute<Data, Variables>;
}
/** Component Wrapper around {@link useMutation} to run a GraphQL query.
 *
 * @remarks
 * `Mutation` is a component wrapper around the {@link useMutation} hook
 * that calls the {@link MutationProps.children} prop, as a function,
 * with the {@link MutationState} object.
 */
declare function Mutation<Data = any, Variables extends AnyVariables = AnyVariables>(props: MutationProps<Data, Variables>): ReactElement<any>;

/** Props accepted by {@link Query}.
 *
 * @remarks
 * `QueryProps` are the props accepted by the {@link Query} component,
 * which is identical to {@link UseQueryArgs}.
 *
 * The result, the {@link QueryState} object, will be passed to
 * a {@link QueryProps.children} function, passed as children
 * to the `Query` component.
 */
type QueryProps<Data = any, Variables extends AnyVariables = AnyVariables> = UseQueryArgs<Variables, Data> & {
    children(arg: QueryState<Data, Variables>): ReactElement<any>;
};
/** Object that {@link QueryProps.children} is called with.
 *
 * @remarks
 * This is an extented {@link UseQueryState} with an added
 * {@link QueryState.executeQuery} method, which is usually
 * part of a tuple returned by {@link useQuery}.
 */
interface QueryState<Data = any, Variables extends AnyVariables = AnyVariables> extends UseQueryState<Data, Variables> {
    /** Alias to {@link useQuery}’s `executeQuery` function. */
    executeQuery: UseQueryExecute;
}
/** Component Wrapper around {@link useQuery} to run a GraphQL query.
 *
 * @remarks
 * `Query` is a component wrapper around the {@link useQuery} hook
 * that calls the {@link QueryProps.children} prop, as a function,
 * with the {@link QueryState} object.
 */
declare function Query<Data = any, Variables extends AnyVariables = AnyVariables>(props: QueryProps<Data, Variables>): ReactElement<any>;

/** Props accepted by {@link Subscription}.
 *
 * @remarks
 * `SubscriptionProps` are the props accepted by the {@link Subscription} component,
 * which is identical to {@link UseSubscriptionArgs} with an added
 * {@link SubscriptionProps.handler} prop, which {@link useSubscription} usually
 * accepts as an additional argument.
 *
 * The result, the {@link SubscriptionState} object, will be passed to
 * a {@link SubscriptionProps.children} function, passed as children
 * to the `Subscription` component.
 */
type SubscriptionProps<Data = any, Result = Data, Variables extends AnyVariables = AnyVariables> = UseSubscriptionArgs<Variables, Data> & {
    handler?: SubscriptionHandler<Data, Result>;
    children(arg: SubscriptionState<Result, Variables>): ReactElement<any>;
};
/** Object that {@link SubscriptionProps.children} is called with.
 *
 * @remarks
 * This is an extented {@link UseSubscriptionState} with an added
 * {@link SubscriptionState.executeSubscription} method, which is usually
 * part of a tuple returned by {@link useSubscription}.
 */
interface SubscriptionState<Data = any, Variables extends AnyVariables = AnyVariables> extends UseSubscriptionState<Data, Variables> {
    /** Alias to {@link useSubscription}’s `executeMutation` function. */
    executeSubscription: UseSubscriptionExecute;
}
/** Component Wrapper around {@link useSubscription} to run a GraphQL subscription.
 *
 * @remarks
 * `Subscription` is a component wrapper around the {@link useSubscription} hook
 * that calls the {@link SubscriptionProps.children} prop, as a function,
 * with the {@link SubscriptionState} object.
 */
declare function Subscription<Data = any, Result = Data, Variables extends AnyVariables = AnyVariables>(props: SubscriptionProps<Data, Result, Variables>): ReactElement<any>;

export { Consumer, Context, Mutation, MutationProps, MutationState, Provider, Query, QueryProps, QueryState, Subscription, SubscriptionHandler, SubscriptionProps, SubscriptionState, UseMutationExecute, UseMutationResponse, UseMutationState, UseQueryArgs, UseQueryExecute, UseQueryResponse, UseQueryState, UseSubscriptionArgs, UseSubscriptionExecute, UseSubscriptionResponse, UseSubscriptionState, useClient, useMutation, useQuery, useSubscription };
